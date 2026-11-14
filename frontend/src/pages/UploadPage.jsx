import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api.js';
import Layout from '../components/Layout.jsx';
import { AppLink, Button, Field, FormError, Icon, IconButton } from '../components/ui.jsx';

const MAX_VIDEO_UPLOAD_BYTES = 40 * 1024 * 1024;

function validate(values, videoFile, thumbnail) {
    const errors = {};
    const title = values.title.trim();
    const description = values.description.trim();

    if (videoFile) {
        if (videoFile.size > MAX_VIDEO_UPLOAD_BYTES || !/\.mp4$/i.test(videoFile.name)) {
            errors.video_file = 'The video must be an MP4 file under 40MB.';
        }
    } else {
        errors.video_file = 'Choose an MP4 video.';
    }

    if (thumbnail && (thumbnail.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(thumbnail.type))) {
        errors.thumbnail = 'Use a JPG, PNG, or WebP thumbnail under 5MB.';
    }

    if (title.length < 3 || title.length > 150) errors.title = 'Title must contain 3 to 150 characters.';
    if (description.length < 5 || description.length > 1000) errors.description = 'Description must contain 5 to 1000 characters.';

    return errors;
}

export default function UploadPage({ user, navigate, notification, dismissNotification, onLogout, notify, onUnauthorized }) {
    const [values, setValues] = useState({ title: '', description: '' });
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnail, setThumbnail] = useState(null);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [attempted, setAttempted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const thumbnailInputRef = useRef(null);

    useEffect(() => {
        if (attempted) setErrors(validate(values, videoFile, thumbnail));
    }, [values, videoFile, thumbnail, attempted]);

    function submit(event) {
        event.preventDefault();
        const nextErrors = validate(values, videoFile, thumbnail);
        setAttempted(true);
        setErrors(nextErrors);
        setFormError('');
        if (Object.keys(nextErrors).length) return;

        const body = new FormData();
        body.append('title', values.title);
        body.append('description', values.description);
        body.append('video_file', videoFile);
        if (thumbnail) body.append('thumbnail', thumbnail);

        setLoading(true);
        apiRequest('videos', { method: 'POST', body })
            .then(response => {
                notify('success', response.message);
                navigate('video', { id: response.data.id });
            })
            .catch(error => {
                if (error.status === 401) return onUnauthorized();
                setErrors(error.data?.errors || {});
                setFormError(error.message);
            })
            .finally(() => setLoading(false));
    }

    function acceptDroppedFile(event) {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) setVideoFile(file);
    }

    function clearThumbnail() {
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
        setThumbnail(null);
    }

    return (
        <Layout user={user} active="upload" navigate={navigate} notification={notification} dismissNotification={dismissNotification} onLogout={onLogout}>
            <div className="page-heading compact">
                <div>
                    <span className="section-kicker">Add to workspace</span>
                    <h1>Upload a video</h1>
                    <p>Add an MP4 file for your team to review.</p>
                </div>
            </div>
            <form className="panel upload-form" onSubmit={submit} noValidate>
                <div className="form-grid">
                    <Field id="video_title" label="Title" value={values.title} error={errors.title} maxLength="150" onChange={event => setValues(current => ({ ...current, title: event.target.value }))} />
                    <div className="form-field thumbnail-field">
                        <label className="field-label-row" htmlFor="thumbnail_file">
                            <span>Thumbnail</span>
                            <span className="field-optional">(optional)</span>
                        </label>
                        <div className="thumbnail-input-row">
                            <input
                                ref={thumbnailInputRef}
                                id="thumbnail_file"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                aria-invalid={Boolean(errors.thumbnail)}
                                onChange={event => setThumbnail(event.target.files?.[0] || null)}
                            />
                            {thumbnail && <IconButton type="button" icon="x" label="Remove thumbnail" variant="danger" onClick={clearThumbnail} />}
                        </div>
                        <div className={`validation-slot ${errors.thumbnail ? 'is-visible' : ''}`}>
                            <p className="inline-error" aria-live="polite">
                                {errors.thumbnail && <><Icon name="triangle-alert" /><span>{errors.thumbnail}</span></>}
                            </p>
                        </div>
                    </div>
                </div>
                <Field id="video_description" label="Description" as="textarea" value={values.description} error={errors.description} maxLength="1000" rows="5" onChange={event => setValues(current => ({ ...current, description: event.target.value }))} />
                <div className="upload-field">
                    <label
                        className={`file-drop ${dragging ? 'is-dragging' : ''}`}
                        htmlFor="video_file"
                        onDragOver={event => { event.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={acceptDroppedFile}
                    >
                        <span className="file-icon" aria-hidden="true"><Icon name="upload" /></span>
                        <strong>{videoFile?.name || 'Choose an MP4 video'}</strong>
                        <span>Maximum file size: 40MB</span>
                        <input id="video_file" type="file" accept="video/mp4" onChange={event => setVideoFile(event.target.files?.[0] || null)} />
                    </label>
                    <div className={`validation-slot ${errors.video_file ? 'is-visible' : ''}`}>
                        <p className="inline-error" aria-live="polite">{errors.video_file && <><Icon name="triangle-alert" /><span>{errors.video_file}</span></>}</p>
                    </div>
                </div>
                <FormError message={formError} />
                <div className="form-actions">
                    <AppLink className="button secondary" page="videos" navigate={navigate}>Cancel</AppLink>
                    <Button type="submit" icon="upload" loading={loading}>Upload video</Button>
                </div>
            </form>
        </Layout>
    );
}
