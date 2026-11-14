import { useEffect, useState } from 'react';
import { apiRequest } from '../api.js';
import { AppLink, Button, Field, FormError } from '../components/ui.jsx';

const emptyLogin = { username: '', password: '' };
const emptyRegister = { first_name: '', last_name: '', username: '', email: '', password: '' };

function validate(mode, values) {
    const errors = {};
    if (!values.username.trim()) errors.username = 'Please enter your username.';
    if (!values.password) errors.password = 'Please enter your password.';

    if (mode === 'register') {
        if (!/^[a-zA-Z -]{2,50}$/.test(values.first_name.trim())) errors.first_name = 'Enter 2 to 50 letters, spaces, or hyphens.';
        if (!/^[a-zA-Z -]{2,50}$/.test(values.last_name.trim())) errors.last_name = 'Enter 2 to 50 letters, spaces, or hyphens.';
        if (!/^[a-z0-9_]{3,30}$/.test(values.username.trim().toLowerCase())) errors.username = 'Username must be 3 to 30 letters, numbers, or underscores.';
        if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
        if (values.password.length < 8) errors.password = 'Password must contain at least 8 characters.';
    }

    return errors;
}

export default function AuthPage({ mode, navigate, onAuthenticated }) {
    const [values, setValues] = useState(mode === 'register' ? emptyRegister : emptyLogin);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [attempted, setAttempted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setValues(mode === 'register' ? emptyRegister : emptyLogin);
        setErrors({});
        setFormError('');
        setAttempted(false);
    }, [mode]);

    function update(name, value) {
        const next = { ...values, [name]: value };
        setValues(next);
        if (attempted) setErrors(validate(mode, next));
    }

    function submit(event) {
        event.preventDefault();
        const nextErrors = validate(mode, values);
        setAttempted(true);
        setErrors(nextErrors);
        setFormError('');
        if (Object.keys(nextErrors).length) return;

        const body = new FormData();
        Object.entries(values).forEach(([key, value]) => body.append(key, value));
        setLoading(true);
        apiRequest(mode, { method: 'POST', body })
            .then(response => onAuthenticated(response.data.user, response.message))
            .catch(error => {
                setErrors(error.data?.errors || {});
                setFormError(error.message);
                setAttempted(true);
            })
            .finally(() => setLoading(false));
    }

    const register = mode === 'register';
    return (
        <div className="auth-body">
            <section className="auth-intro">
                <a className="brand brand-light" href="/">
                    <span className="brand-mark"><img src="/images/frame-logo.svg" alt="VideoLab logo" width="26" height="26" /></span>
                    <span>VideoLab</span>
                </a>
                <div className="auth-message">
                    <span className="eyebrow">Every detail matters</span>
                    <h1>Good ideas<br />deserve a <em>closer look.</em></h1>
                    <p>Your space for thoughtful video feedback.<br />Watch, draw, and keep the moments that matter.</p>
                </div>
            </section>
            <section className="auth-panel">
                <div className="auth-card">
                    <span className="section-kicker">Back in focus</span>
                    <h2>{register ? 'Create your account.' : 'Welcome back.'}</h2>
                    <p>{register ? 'Set up your workspace in a moment.' : 'Log in to pick up where you left off.'}</p>
                    <FormError message={formError} />
                    <form className="form-stack" onSubmit={submit} noValidate>
                        {register && (
                            <div className="form-grid">
                                <Field id="first_name" label="First name" value={values.first_name} error={errors.first_name} maxLength="50" onChange={event => update('first_name', event.target.value)} />
                                <Field id="last_name" label="Last name" value={values.last_name} error={errors.last_name} maxLength="50" onChange={event => update('last_name', event.target.value)} />
                            </div>
                        )}
                        <Field id="auth_username" label="Username" value={values.username} error={errors.username} maxLength="30" autoComplete="username" onChange={event => update('username', event.target.value)} />
                        {register && <Field id="auth_email" label="Email" type="email" value={values.email} error={errors.email} maxLength="120" autoComplete="email" onChange={event => update('email', event.target.value)} />}
                        <Field id="auth_password" label="Password" type="password" value={values.password} error={errors.password} autoComplete={register ? 'new-password' : 'current-password'} onChange={event => update('password', event.target.value)} />
                        <Button type="submit" wide loading={loading}>{register ? 'Create account' : 'Log in'}</Button>
                    </form>
                    <p className="auth-switch">
                        {register ? 'Already have an account? ' : 'New to VideoLab? '}
                        <AppLink page="auth" params={register ? {} : { mode: 'register' }} navigate={navigate}>
                            {register ? 'Log in' : 'Create an account'}
                        </AppLink>
                    </p>
                </div>
            </section>
        </div>
    );
}
