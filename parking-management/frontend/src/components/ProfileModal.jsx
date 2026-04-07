import { useState, useRef, useEffect } from 'react';
import { useApp } from '../services/AppContext';
import styles from './ProfileModal.module.css';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    avatar: ''
  });
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '', // default empty for simulation
        avatar: user.avatar || ''
      });
      setPreview(user.avatar || '');
      setMessage('');
      setError('');
    }
  }, [user, isOpen]);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setMessage('');
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError('Image must be less than 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFormData(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
    setMessage('');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    // Pass data without overwriting password if it's empty (simulation)
    const updatePayload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      avatar: formData.avatar
    };
    if (formData.password) {
      updatePayload.password = formData.password;
    }

    const result = updateProfile(updatePayload);
    if (result.success) {
      setMessage('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError('Failed to update profile.');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Profile Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              {preview ? (
                <img src={preview} alt="Profile Preview" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <button 
                type="button" 
                className={styles.uploadBtn} 
                onClick={() => fileInputRef.current.click()}
              >
                📷 Change
              </button>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>User ID</label>
            <input type="text" value={user.id} disabled className={styles.disabledInput} />
          </div>

          <div className={styles.formGroup}>
            <label>Role</label>
            <input type="text" value={user.role} disabled className={styles.disabledInput} style={{ textTransform: 'capitalize' }} />
          </div>

          <div className={styles.formGroup}>
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g. 9876543210" />
          </div>

          <div className={styles.formGroup}>
            <label>New Password (Optional)</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" />
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}
          {message && <div className={styles.successMsg}>{message}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
