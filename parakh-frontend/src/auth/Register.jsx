import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Very Weak', color: 'bg-red-500' },
      { strength: 2, label: 'Weak', color: 'bg-orange-500' },
      { strength: 3, label: 'Fair', color: 'bg-yellow-500' },
      { strength: 4, label: 'Strong', color: 'bg-green-500' },
      { strength: 5, label: 'Very Strong', color: 'bg-green-600' }
    ];

    return levels[strength];
  };

  const getFieldError = (field) => {
    if (!touched[field]) return '';

    switch (field) {
      case 'name':
        if (!formData.name.trim()) return 'Name is required';
        if (formData.name.length < 3) return 'Name must be at least 3 characters';
        return '';
      case 'email':
        if (!formData.email.trim()) return 'Email is required';
        if (!validateEmail(formData.email)) return 'Invalid email format';
        return '';
      case 'institution':
        if (!formData.institution.trim()) return 'Institution is required';
        return '';
      case 'password':
        if (!formData.password) return 'Password is required';
        if (formData.password.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (!formData.confirmPassword) return 'Please confirm your password';
        if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      institution: true,
      password: true,
      confirmPassword: true
    });

    // Validate all fields
    const errors = ['name', 'email', 'institution', 'password', 'confirmPassword']
      .map(field => getFieldError(field) || (field === field && ''))
      .filter(Boolean);

    if (errors.length > 0) {
      setError('Please fix all validation errors before proceeding.');
      return;
    }

    // Additional validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        institution: formData.institution,
        password: formData.password,
        role: formData.role
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (success) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface-50 p-4">
        <div className="w-full max-w-md bg-white border-2 border-green-500 shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Registration Successful!</h2>
          <p className="text-surface-600 mb-4">Your account has been created successfully.</p>
          <p className="text-sm text-surface-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface-50">
      {/* Government Header Strip */}
      <div className="bg-black text-white px-4 sm:px-6 lg:px-8 py-1.5 flex justify-between items-center text-[10px] md:text-xs font-bold uppercase tracking-widest">
        <div className="flex gap-4">
          <span>Government of India</span>
          <span className="hidden sm:inline opacity-50">|</span>
          <span className="hidden sm:inline">Ministry of Education</span>
        </div>
        <div className="flex gap-4">
          <span>Skip to Main Content</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="flex flex-col items-center justify-center w-12 h-16 opacity-80 mx-auto mb-4">
            <div className="w-8 h-8 rounded-full border-2 border-primary-900 mb-1"></div>
            <div className="w-10 h-1 bg-primary-900 mb-1"></div>
            <div className="text-[8px] font-bold uppercase text-primary-900">Satyamev Jayate</div>
          </div>
          <h1 className="text-3xl font-bold text-primary-900 tracking-tight mb-2">
            PARAKH
          </h1>
          <h2 className="text-sm text-surface-600 font-semibold uppercase tracking-wider">
            National Assessment Centre, NCERT
          </h2>
        </div>

        {/* Register Card */}
        <div className="w-full max-w-2xl bg-white border-2 border-surface-300 shadow-lg p-8">
          <div className="mb-6 pb-4 border-b-2 border-primary-900">
            <h3 className="text-xl font-bold text-primary-900 uppercase">User Registration</h3>
            <p className="text-sm text-surface-600 mt-1">Create an official account for assessment access</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-600 text-red-800 px-4 py-3 text-sm font-medium flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-surface-700 mb-1 uppercase tracking-wide">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  className={`w-full px-3 py-2.5 bg-white border-2 focus:outline-none text-surface-900 transition-all ${getFieldError('name') ? 'border-red-500 focus:border-red-600' : 'border-surface-300 focus:border-primary-600'
                    }`}
                  placeholder="Ex: Rajesh Kumar"
                />
                {getFieldError('name') && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{getFieldError('name')}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-surface-700 mb-1 uppercase tracking-wide">
                  Email ID <span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-3 py-2.5 bg-white border-2 focus:outline-none text-surface-900 transition-all ${getFieldError('email') ? 'border-red-500 focus:border-red-600' : 'border-surface-300 focus:border-primary-600'
                    }`}
                  placeholder="name@example.com"
                />
                {getFieldError('email') && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{getFieldError('email')}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="institution" className="block text-sm font-bold text-surface-700 mb-1 uppercase tracking-wide">
                Institution / School Name <span className="text-red-600">*</span>
              </label>
              <input
                id="institution"
                name="institution"
                type="text"
                autoComplete="organization"
                required
                value={formData.institution}
                onChange={handleChange}
                onBlur={() => handleBlur('institution')}
                className={`w-full px-3 py-2.5 bg-white border-2 focus:outline-none text-surface-900 transition-all ${getFieldError('institution') ? 'border-red-500 focus:border-red-600' : 'border-surface-300 focus:border-primary-600'
                  }`}
                placeholder="Ex: Kendriya Vidyalaya, Delhi"
              />
              {getFieldError('institution') && (
                <p className="mt-1 text-xs text-red-600 font-medium">{getFieldError('institution')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-surface-700 mb-1 uppercase tracking-wide">
                  Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    className={`w-full px-3 py-2.5 pr-10 bg-white border-2 focus:outline-none text-surface-900 transition-all ${getFieldError('password') ? 'border-red-500 focus:border-red-600' : 'border-surface-300 focus:border-primary-600'
                      }`}
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-700 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${level <= passwordStrength.strength ? passwordStrength.color : 'bg-surface-200'
                            }`}
                        ></div>
                      ))}
                    </div>
                    {passwordStrength.label && (
                      <p className="text-xs text-surface-600">
                        Strength: <span className="font-semibold">{passwordStrength.label}</span>
                      </p>
                    )}
                  </div>
                )}
                {getFieldError('password') && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{getFieldError('password')}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-surface-700 mb-1 uppercase tracking-wide">
                  Confirm Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`w-full px-3 py-2.5 pr-10 bg-white border-2 focus:outline-none text-surface-900 transition-all ${getFieldError('confirmPassword') ? 'border-red-500 focus:border-red-600' : 'border-surface-300 focus:border-primary-600'
                      }`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-700 p-1"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {getFieldError('confirmPassword') && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{getFieldError('confirmPassword')}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-bold text-surface-700 mb-1 uppercase tracking-wide">
                Role <span className="text-red-600">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border-2 border-surface-300 focus:border-primary-600 focus:outline-none text-surface-900 transition-all"
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
              </select>
              <p className="mt-1 text-xs text-surface-500">Select your role in the assessment system</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 text-white font-bold shadow-md transition-all uppercase tracking-wide text-sm ${loading
                  ? 'bg-surface-400 cursor-not-allowed'
                  : 'bg-primary-900 hover:bg-primary-800 focus:ring-2 focus:ring-offset-2 focus:ring-primary-700'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Register'
              )}
            </button>

            <div className="pt-4 border-t border-surface-200 text-center">
              <p className="text-sm text-surface-600">
                Already registered?{' '}
                <Link to="/login" className="font-bold text-primary-700 hover:text-primary-900 hover:underline">
                  Sign In Here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-surface-500">
          <p className="mb-2">© 2024 National Council of Educational Research and Training (NCERT)</p>
          <p className="font-semibold uppercase tracking-wider">Government of India | Ministry of Education | PARAKH</p>
        </div>
      </div>
    </div>
  );
};

export default Register;