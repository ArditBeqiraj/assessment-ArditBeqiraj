import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest, apiUrl, backendAssetUrl } from '../api.js';
import Layout from '../components/Layout.jsx';
import { AppLink, Icon, IconButton } from '../components/ui.jsx';
import { MomentComposer, MomentSection } from '../components/Moments.jsx';
import { formatTime } from '../utils/format.js';

function sortedMoments(items) {
    return [...items].sort((left, right) => Number(left.timestamp) - Number(right.timestamp) || Number(left.id) - Number(right.id));
}

export default function VideoPage({ user, params, navigate, notification, dismissNotification, onLogout, notify, onUnauthorized }) {
    const id = Number(params.id) || 0;
    const [details, setDetails] = useState(null);
    const [error, setError] = useState('');
    const [annotations, setAnnotations] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [annotationOpen, setAnnotationOpen] = useState(false);
    const [bookmarkOpen, setBookmarkOpen] = useState(false);
    const [annotationTime, setAnnotationTime] = useState(0);
    const [bookmarkTime, setBookmarkTime] = useState(0);
    const [annotationDescription, setAnnotationDescription] = useState('');
    const [bookmarkTitle, setBookmarkTitle] = useState('');
    const [annotationAttempted, setAnnotationAttempted] = useState(false);
    const [bookmarkAttempted, setBookmarkAttempted] = useState(false);
    const [annotationServerError, setAnnotationServerError] = useState('');
    const [bookmarkServerError, setBookmarkServerError] = useState('');
    const [saving, setSaving] = useState('');
    const [strokes, setStrokes] = useState([]);
    const [annotationTool, setAnnotationTool] = useState('pen');
    const [fullscreen, setFullscreen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const stageRef = useRef(null);
    const drawingRef = useRef(false);
    const drawingStartRef = useRef(null);
    const strokesRef = useRef([]);

    function savedStrokesAtTime() {
        return annotations
            .filter(annotation => Math.abs(Number(annotation.timestamp) - currentTime) <= 0.5)
            .flatMap(annotation => Array.isArray(annotation.drawing_data) ? annotation.drawing_data : []);
    }

    useEffect(() => {
        let active = true;
        setError('');
        setDetails(null);
        apiRequest('video', { params: { id } })
            .then(response => {
                if (!active) return;
                setDetails(response.data);
                setAnnotations(response.data.annotations || []);
                setBookmarks(response.data.bookmarks || []);
                setDuration(Number(response.data.video.duration_seconds) || 0);
            })
            .catch(requestError => {
                if (!active) return;
                if (requestError.status === 401) onUnauthorized();
                else setError(requestError.message);
            });
        return () => { active = false; };
    }, [id, onUnauthorized]);

    function videoContentRect() {
        const stage = stageRef.current;
        const video = videoRef.current;
        if (!stage) return { left: 0, top: 0, width: 0, height: 0 };

        const bounds = stage.getBoundingClientRect();
        const videoWidth = video?.videoWidth || 16;
        const videoHeight = video?.videoHeight || 9;
        const scale = Math.min(bounds.width / videoWidth, bounds.height / videoHeight);
        const width = videoWidth * scale;
        const height = videoHeight * scale;

        return {
            left: (bounds.width - width) / 2,
            top: (bounds.height - height) / 2,
            width,
            height,
        };
    }

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        const ratio = window.devicePixelRatio || 1;
        const content = videoContentRect();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = Math.max(3, ratio * 3);
        context.strokeStyle = '#d53228';

        const visibleStrokes = annotationOpen ? strokesRef.current : savedStrokesAtTime();
        visibleStrokes.forEach(stroke => {
            if (!Array.isArray(stroke.points) || stroke.points.length < 2) return;
            const points = stroke.points.map(point => ({
                x: (content.left + point.x * content.width) * ratio,
                y: (content.top + point.y * content.height) * ratio,
            }));

            if (stroke.type === 'rect') {
                const start = points[0];
                const end = points[points.length - 1];
                context.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
                return;
            }

            if (stroke.type === 'circle') {
                const start = points[0];
                const end = points[points.length - 1];
                const centerX = (start.x + end.x) / 2;
                const centerY = (start.y + end.y) / 2;
                context.beginPath();
                context.ellipse(
                    centerX,
                    centerY,
                    Math.abs(end.x - start.x) / 2,
                    Math.abs(end.y - start.y) / 2,
                    0,
                    0,
                    Math.PI * 2,
                );
                context.stroke();
                return;
            }

            context.beginPath();
            points.forEach((point, index) => {
                if (index === 0) context.moveTo(point.x, point.y);
                else context.lineTo(point.x, point.y);
            });
            context.stroke();
        });
    }, [annotationOpen, annotations, currentTime]);

    useEffect(() => {
        strokesRef.current = strokes;
        redraw();
    }, [strokes, redraw]);

    useEffect(() => {
        const stage = stageRef.current;
        const canvas = canvasRef.current;
        if (!stage || !canvas) return undefined;
        const resize = () => {
            const bounds = stage.getBoundingClientRect();
            const ratio = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.round(bounds.width * ratio));
            canvas.height = Math.max(1, Math.round(bounds.height * ratio));
            redraw();
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(stage);
        return () => observer.disconnect();
    }, [details, redraw]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const active = document.fullscreenElement === stageRef.current;
            setFullscreen(active);
            window.requestAnimationFrame(redraw);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [redraw]);

    function updateStrokes(next) {
        strokesRef.current = next;
        setStrokes(next);
    }

    function canvasPoint(event) {
        const bounds = stageRef.current.getBoundingClientRect();
        const content = videoContentRect();
        return {
            x: Math.min(1, Math.max(0, (event.clientX - bounds.left - content.left) / content.width)),
            y: Math.min(1, Math.max(0, (event.clientY - bounds.top - content.top) / content.height)),
        };
    }

    function startDrawing(event) {
        if (!annotationOpen) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        drawingRef.current = true;
        const point = canvasPoint(event);
        drawingStartRef.current = point;
        updateStrokes([...strokesRef.current, { type: annotationTool, color: '#d53228', points: [point] }]);
    }

    function continueDrawing(event) {
        if (!drawingRef.current || !annotationOpen) return;
        event.preventDefault();
        const point = canvasPoint(event);
        const next = strokesRef.current.map((stroke, index) => {
            if (index !== strokesRef.current.length - 1) return stroke;
            return stroke.type === 'pen'
                ? { ...stroke, points: [...stroke.points, point] }
                : { ...stroke, points: [drawingStartRef.current, point] };
        });
        updateStrokes(next);
    }

    function stopDrawing(event) {
        drawingRef.current = false;
        drawingStartRef.current = null;
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }

    function togglePlayback() {
        const player = videoRef.current;
        if (!player) return;
        if (player.paused) player.play().catch(() => {});
        else player.pause();
    }

    function seek(value, shouldPlay = false) {
        const player = videoRef.current;
        if (!player) return;
        const target = Math.min(Number.isFinite(player.duration) ? player.duration : duration, Math.max(0, Number(value) || 0));
        player.currentTime = target;
        setCurrentTime(target);
        updateStrokes([]);
        if (shouldPlay) player.play().catch(() => {});
    }

    function toggleFullscreen() {
        if (!stageRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen?.();
            return;
        }

        closeAnnotation();
        closeBookmark();
        stageRef.current.requestFullscreen?.();
    }

    function openAnnotation() {
        const timestamp = videoRef.current?.currentTime || 0;
        videoRef.current?.pause();
        setBookmarkOpen(false);
        setAnnotationOpen(true);
        setAnnotationTool('pen');
        setAnnotationTime(timestamp);
        setAnnotationDescription('');
        setAnnotationAttempted(false);
        setAnnotationServerError('');
        updateStrokes([]);
    }

    function closeAnnotation() {
        setAnnotationOpen(false);
        setAnnotationDescription('');
        setAnnotationAttempted(false);
        setAnnotationServerError('');
        drawingRef.current = false;
        drawingStartRef.current = null;
        updateStrokes([]);
    }

    function openBookmark() {
        const timestamp = videoRef.current?.currentTime || 0;
        videoRef.current?.pause();
        closeAnnotation();
        setBookmarkOpen(true);
        setBookmarkTime(timestamp);
        setBookmarkTitle('');
        setBookmarkAttempted(false);
        setBookmarkServerError('');
    }

    function closeBookmark() {
        setBookmarkOpen(false);
        setBookmarkTitle('');
        setBookmarkAttempted(false);
        setBookmarkServerError('');
    }

    const validDrawing = strokes.some(stroke => (
        Array.isArray(stroke.points)
        && stroke.points.length >= 2
        && ['pen', 'circle', 'rect'].includes(stroke.type)
    ));
    const annotationError = annotationAttempted
        ? (!annotationDescription.trim() ? 'Please enter a description.' : (!validDrawing ? 'Please draw on the video before saving.' : annotationServerError))
        : '';
    const bookmarkError = bookmarkAttempted
        ? (!bookmarkTitle.trim() ? 'Please enter a bookmark description.' : bookmarkServerError)
        : '';

    function saveAnnotation(event) {
        event.preventDefault();
        setAnnotationAttempted(true);
        setAnnotationServerError('');
        if (!annotationDescription.trim() || !validDrawing) return;

        const body = new FormData();
        body.append('video_id', String(id));
        body.append('timestamp', annotationTime.toFixed(3));
        body.append('description', annotationDescription.trim());
        body.append('drawing_data', JSON.stringify(strokes));
        setSaving('annotation');
        apiRequest('annotations', { method: 'POST', body })
            .then(response => {
                const item = { ...response.data.annotation, username: user.username };
                setAnnotations(current => sortedMoments([...current, item]));
                closeAnnotation();
                notify('success', response.message);
            })
            .catch(requestError => {
                if (requestError.status === 401) return onUnauthorized();
                setAnnotationServerError(requestError.data?.errors?.description || requestError.data?.errors?.drawing_data || requestError.message);
                setAnnotationAttempted(true);
            })
            .finally(() => setSaving(''));
    }

    function saveBookmark(event) {
        event.preventDefault();
        setBookmarkAttempted(true);
        setBookmarkServerError('');
        if (!bookmarkTitle.trim()) return;

        const body = new FormData();
        body.append('video_id', String(id));
        body.append('timestamp', bookmarkTime.toFixed(3));
        body.append('title', bookmarkTitle.trim());
        setSaving('bookmark');
        apiRequest('bookmarks', { method: 'POST', body })
            .then(response => {
                const item = { ...response.data.bookmark, username: user.username };
                setBookmarks(current => sortedMoments([...current, item]));
                closeBookmark();
                notify('success', response.message);
            })
            .catch(requestError => {
                if (requestError.status === 401) return onUnauthorized();
                setBookmarkServerError(requestError.data?.errors?.title || requestError.message);
                setBookmarkAttempted(true);
            })
            .finally(() => setSaving(''));
    }

    return (
        <Layout user={user} active="videos" navigate={navigate} notification={notification} dismissNotification={dismissNotification} onLogout={onLogout}>
            {error && <div className="not-found panel"><h1>Video unavailable</h1><p>{error}</p><AppLink className="button primary" page="videos" navigate={navigate}>Back to videos</AppLink></div>}
            {!details && !error && <div className="section-loading">Loading video…</div>}
            {details && <>
                <div className="review-heading">
                    <div>
                        <AppLink className="back-link" page="videos" navigate={navigate}><Icon name="arrow-left" /><span>Back to library</span></AppLink>
                        <h1>{details.video.title}</h1>
                        <p>{details.video.description}</p>
                    </div>
                    <div className="owner-label"><span className="avatar small">{details.video.username?.charAt(0).toUpperCase()}</span>Uploaded by {details.video.username}</div>
                </div>
                <div className="review-layout">
                    <section>
                        <div className={`video-stage ${fullscreen ? 'is-fullscreen' : ''}`} ref={stageRef}>
                            <video
                                ref={videoRef}
                                preload="metadata"
                                muted
                                playsInline
                                poster={details.video.thumbnail ? backendAssetUrl(`uploads/${details.video.thumbnail}`) : undefined}
                                onLoadedMetadata={event => setDuration(event.currentTarget.duration || Number(details.video.duration_seconds))}
                                onDurationChange={event => setDuration(event.currentTarget.duration || Number(details.video.duration_seconds))}
                                onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
                                onSeeking={event => setCurrentTime(event.currentTarget.currentTime)}
                                onSeeked={event => setCurrentTime(event.currentTarget.currentTime)}
                                onPlay={() => setPlaying(true)}
                                onPause={() => setPlaying(false)}
                                onEnded={() => setPlaying(false)}
                                onClick={togglePlayback}
                            >
                                <source src={apiUrl('stream', { id })} type="video/mp4" />
                            </video>
                            <canvas
                                id="annotation_canvas"
                                ref={canvasRef}
                                className={annotationOpen ? 'drawing' : ''}
                                style={{ pointerEvents: annotationOpen ? 'auto' : 'none' }}
                                onPointerDown={startDrawing}
                                onPointerMove={continueDrawing}
                                onPointerUp={stopDrawing}
                                onPointerCancel={stopDrawing}
                            />
                            {annotationOpen && <span className="drawing-label">Drawing at <b>{formatTime(annotationTime)}</b></span>}
                            <div className="fullscreen-controls">
                                <button type="button" className="fullscreen-control" aria-label={playing ? 'Pause video' : 'Play video'} onClick={togglePlayback}>
                                    <Icon name={playing ? 'pause' : 'play'} />
                                </button>
                                <button type="button" className="fullscreen-control" aria-label="Exit fullscreen" onClick={toggleFullscreen}>
                                    <Icon name="minimize" />
                                </button>
                            </div>
                        </div>
                        <div className="player-controls">
                            <button id="play_button" type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlayback}><Icon name={playing ? 'pause' : 'play'} /></button>
                            <span>{formatTime(currentTime)}</span>
                            <input
                                id="timeline"
                                type="range"
                                min="0"
                                max={duration || Number(details.video.duration_seconds)}
                                value={Math.min(currentTime, duration || Number(details.video.duration_seconds))}
                                step="0.1"
                                aria-label="Seek video"
                                style={{ '--seek-progress': `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                onChange={event => seek(Number(event.target.value))}
                                onKeyDown={event => {
                                    if (event.key === 'ArrowRight') { event.preventDefault(); seek(currentTime + 5); }
                                    if (event.key === 'ArrowLeft') { event.preventDefault(); seek(currentTime - 5); }
                                }}
                            />
                            <span>{formatTime(duration || details.video.duration_seconds)}</span>
                            <IconButton icon={fullscreen ? 'minimize' : 'maximize'} label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} onClick={toggleFullscreen} />
                        </div>
                    </section>
                    <aside className="moment-panel">
                        <MomentSection type="annotation" items={annotations} onAdd={openAnnotation} onSelect={time => seek(time, true)}>
                            <MomentComposer
                                type="annotation"
                                open={annotationOpen}
                                timestamp={annotationTime}
                                value={annotationDescription}
                                onChange={value => { setAnnotationDescription(value); setAnnotationServerError(''); }}
                                onCancel={closeAnnotation}
                                onSubmit={saveAnnotation}
                                tool={annotationTool}
                                onToolChange={setAnnotationTool}
                                error={annotationError}
                                descriptionError={annotationAttempted && !annotationDescription.trim()}
                                loading={saving === 'annotation'}
                            />
                        </MomentSection>
                        <MomentSection type="bookmark" items={bookmarks} onAdd={openBookmark} onSelect={time => seek(time, true)}>
                            <MomentComposer
                                type="bookmark"
                                open={bookmarkOpen}
                                timestamp={bookmarkTime}
                                value={bookmarkTitle}
                                onChange={value => { setBookmarkTitle(value); setBookmarkServerError(''); }}
                                onCancel={closeBookmark}
                                onSubmit={saveBookmark}
                                error={bookmarkError}
                                descriptionError={bookmarkAttempted && !bookmarkTitle.trim()}
                                loading={saving === 'bookmark'}
                            />
                        </MomentSection>
                    </aside>
                </div>
            </>}
        </Layout>
    );
}
