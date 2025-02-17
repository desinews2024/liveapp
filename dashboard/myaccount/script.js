// User Data Management
class UserDataManager {
    constructor() {
        this.userData = null;
    }

    init() {
        this.checkAuth();
        this.loadUserData();
    }

    checkAuth() {
        const userAuth = localStorage.getItem('userAuth');
        if (!userAuth) {
            window.location.href = '../../login.html';
            return;
        }
        try {
            const userData = JSON.parse(userAuth);
            if (!userData.isLoggedIn) {
                window.location.href = '../../login.html';
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            window.location.href = '../../login.html';
        }
    }

    loadUserData() {
        try {
            const userAuth = localStorage.getItem('userAuth');
            if (userAuth) {
                this.userData = JSON.parse(userAuth);
                this.displayUserData();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    displayUserData() {
        if (this.userData) {
            document.getElementById('username').textContent = this.userData.username || 'User';
            document.getElementById('userMobile').textContent = this.userData.mobile || '';
            
            // Update profile picture if available
            const profilePic = document.getElementById('profilePic');
            const previewPic = document.getElementById('previewPic');
            if (this.userData.profilePic) {
                profilePic.src = this.userData.profilePic;
                previewPic.src = this.userData.profilePic;
            }

            // Update form inputs
            document.getElementById('usernameInput').value = this.userData.username || '';
            document.getElementById('mobileInput').value = this.userData.mobile || '';
            document.getElementById('emailInput').value = this.userData.email || '';
        }
    }

    updateUserData(formData) {
        try {
            const updatedData = { ...this.userData, ...formData };
            localStorage.setItem('userAuth', JSON.stringify(updatedData));
            this.userData = updatedData;
            this.displayUserData();
            return true;
        } catch (error) {
            console.error('Error updating user data:', error);
            return false;
        }
    }

    logout() {
        try {
            localStorage.removeItem('userAuth');
            window.location.href = '../../login.html';
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Error logging out. Please try again.');
        }
    }
}

class UIHandler {
    constructor(userDataManager) {
        this.userDataManager = userDataManager;
        this.isEditMode = false;
        this.popup = document.getElementById('editProfilePopup');
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Back button
        document.querySelector('.back-btn')?.addEventListener('click', () => this.goBack());

        // Edit button
        document.querySelector('.edit-btn')?.addEventListener('click', () => this.showEditPopup());

        // Close popup button
        document.querySelector('.close-btn')?.addEventListener('click', () => this.hideEditPopup());
        document.querySelector('.cancel-btn')?.addEventListener('click', () => this.hideEditPopup());

        // Profile picture upload
        const profilePicInput = document.getElementById('profilePicInput');
        const uploadBtn = document.querySelector('.upload-btn');
        uploadBtn?.addEventListener('click', () => profilePicInput.click());
        profilePicInput?.addEventListener('change', (e) => this.handleProfilePicChange(e));

        // Form submission
        document.getElementById('editProfileForm')?.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Logout button
        document.querySelector('.account-footer .logout-btn')?.addEventListener('click', () => this.userDataManager.logout());

        // Settings
        document.querySelectorAll('.setting-item').forEach(item => {
            const settingType = item.getAttribute('data-setting');
            if (settingType === 'sign-out') {
                item.addEventListener('click', () => {
                    localStorage.clear();
                    window.location.href = '../../login.html';
                });
            }
        });
    }

    showEditPopup() {
        this.popup.classList.add('active');
    }

    hideEditPopup() {
        this.popup.classList.remove('active');
    }

    async handleProfilePicChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const preview = await this.createImagePreview(file);
            document.getElementById('previewPic').src = preview;
        } catch (error) {
            console.error('Error handling profile picture:', error);
            alert('Failed to load image. Please try again.');
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('usernameInput').value,
            mobile: document.getElementById('mobileInput').value,
            email: document.getElementById('emailInput').value
        };

        const password = document.getElementById('passwordInput').value;
        if (password) {
            formData.password = password;
        }

        const previewPic = document.getElementById('previewPic');
        if (previewPic.src !== this.userDataManager.userData?.profilePic) {
            formData.profilePic = previewPic.src;
        }

        if (this.userDataManager.updateUserData(formData)) {
            this.showMessage('Profile updated successfully!', 'success');
            this.hideEditPopup();
        } else {
            this.showMessage('Failed to update profile. Please try again.', 'error');
        }
    }

    createImagePreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const maxSize = 500;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height *= maxSize / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width *= maxSize / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    goBack() {
        window.location.href = '../index.html';
    }

    handleSettingClick(item) {
        const label = item.querySelector('.setting-label').textContent.toLowerCase();
        const message = `${label} settings will be implemented soon!`;
        alert(message);
    }
}

// Video Upload Functionality
document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.querySelector('.upload-video-btn');
    const videoModal = document.getElementById('videoUploadModal');
    const closeModal = document.querySelector('.close-modal');
    const uploadForm = document.getElementById('videoUploadForm');
    const detectLocationBtn = document.getElementById('detectLocation');
    const cancelUploadBtn = document.querySelector('.cancel-upload');
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const uploadProgress = document.querySelector('.upload-progress');
    const videoGrid = document.querySelector('.video-grid');
    const videoFile = document.getElementById('videoFile');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');

    if (!uploadBtn || !videoModal || !uploadForm) {
        console.error('Required elements not found');
        return;
    }

    // Show modal
    uploadBtn.addEventListener('click', () => {
        videoModal.classList.add('active');
    });

    // Close modal
    function closeVideoModal() {
        videoModal.classList.remove('active');
        uploadForm.reset();
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
        }
        if (uploadPlaceholder) {
            uploadPlaceholder.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Click to select or drag video here</p>
            `;
        }
    }

    // Close on click outside modal
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });

    if (closeModal) {
        closeModal.addEventListener('click', closeVideoModal);
    }
    if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', closeVideoModal);
    }

    // Auto-detect location
    if (detectLocationBtn) {
        detectLocationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                detectLocationBtn.disabled = true;
                detectLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                            const data = await response.json();
                            const location = data.display_name;
                            document.getElementById('videoLocation').value = location;
                        } catch (error) {
                            console.error('Error getting location:', error);
                            alert('Could not get location. Please enter manually.');
                        } finally {
                            detectLocationBtn.disabled = false;
                            detectLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
                        }
                    },
                    (error) => {
                        console.error('Error:', error);
                        detectLocationBtn.disabled = false;
                        detectLocationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
                        alert('Could not detect location. Please enter manually.');
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser');
            }
        });
    }

    // Handle file input change
    if (videoFile && uploadPlaceholder) {
        videoFile.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                const file = e.target.files[0];
                uploadPlaceholder.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <p>${file.name}</p>
                `;
            }
        });

        // Add drag and drop support
        const uploadBox = document.querySelector('.video-upload-box');
        if (uploadBox) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadBox.addEventListener(eventName, preventDefaults, false);
            });

            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            ['dragenter', 'dragover'].forEach(eventName => {
                uploadBox.addEventListener(eventName, () => {
                    uploadBox.classList.add('highlight');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                uploadBox.addEventListener(eventName, () => {
                    uploadBox.classList.remove('highlight');
                });
            });

            uploadBox.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const file = dt.files[0];
                videoFile.files = dt.files;
                if (file) {
                    uploadPlaceholder.innerHTML = `
                        <i class="fas fa-check-circle"></i>
                        <p>${file.name}</p>
                    `;
                }
            });
        }
    }

    // Handle form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(uploadForm);
            const title = formData.get('videoTitle');
            const file = formData.get('videoFile');
            
            if (!file) {
                alert('Please select a video file');
                return;
            }
            
            if (!title) {
                alert('Please enter a title');
                return;
            }

            if (uploadProgress) {
                uploadProgress.style.display = 'block';
            }
            
            // Simulated upload progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                if (progress <= 100 && progressBar && progressText) {
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `${progress}%`;
                }
                
                if (progress === 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        // Add the new video to the grid
                        if (videoGrid) {
                            const newVideo = createVideoElement(title, file);
                            videoGrid.insertBefore(newVideo, videoGrid.firstChild);
                        }
                        
                        closeVideoModal();
                        alert('Video uploaded successfully!');
                    }, 500);
                }
            }, 200);
        });
    }

    // Create video element
    function createVideoElement(title, file) {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        
        const thumbnail = URL.createObjectURL(file);
        
        videoItem.innerHTML = `
            <div class="video-thumbnail">
                <video src="${thumbnail}" poster="${thumbnail}"></video>
                <span class="video-duration">0:00</span>
                <button class="play-btn">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="video-info">
                <h4>${title}</h4>
                <p>Just now • 0 views</p>
            </div>
        `;

        // Clean up object URL when video loads
        const video = videoItem.querySelector('video');
        video.addEventListener('loadedmetadata', () => {
            // Update video duration
            const minutes = Math.floor(video.duration / 60);
            const seconds = Math.floor(video.duration % 60);
            const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            videoItem.querySelector('.video-duration').textContent = duration;
        });
        
        return videoItem;
    }
});

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const userDataManager = new UserDataManager();
    const uiHandler = new UIHandler(userDataManager);
    
    userDataManager.init();
    uiHandler.init();
});

// Function to show toast message
function showToast(message, duration = 3000) {
    try {
        const toast = document.getElementById('toast-message');
        if (!toast) return;
        
        const toastText = toast.querySelector('.toast-text');
        if (!toastText) return;
        
        toastText.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    } catch (error) {
        console.error('Error showing toast:', error);
    }
}


// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Set up event listeners for settings
        const settingItems = document.querySelectorAll('.setting-item');
        settingItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default action
                const settingName = item.getAttribute('data-setting');
                handleSettingClick(settingName);
            });
        });

        // Load saved profile data
        const savedData = localStorage.getItem('userProfile');
        if (savedData) {
            const userData = JSON.parse(savedData);
            
            // Update form fields
            const fields = {
                'usernameInput': userData.username,
                'nameInput': userData.name,
                'mobileInput': userData.mobile,
                'locationInput': userData.location,
                'emailInput': userData.email
            };

            Object.entries(fields).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element && value) {
                    element.value = value;
                }
            });

            // Update profile pictures
            if (userData.profilePic) {
                const profilePic = document.getElementById('profilePic');
                const previewPic = document.getElementById('previewPic');
                if (profilePic) profilePic.src = userData.profilePic;
                if (previewPic) previewPic.src = userData.profilePic;
            }
        }

        // Profile picture upload
        const profilePicInput = document.getElementById('profilePicInput');
        const uploadBtn = document.querySelector('.upload-btn');
        if (uploadBtn && profilePicInput) {
            uploadBtn.addEventListener('click', () => {
                profilePicInput.click();
            });
            profilePicInput.addEventListener('change', handleProfilePicChange);
        }

        // Form submission
        const editProfileForm = document.getElementById('editProfileForm');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', handleFormSubmit);
        }

        // Popup close handlers
        const editProfilePopup = document.getElementById('editProfilePopup');
        const closeBtn = document.querySelector('.close-btn');
        const cancelBtn = document.querySelector('.cancel-btn');

        if (closeBtn && editProfilePopup) {
            closeBtn.addEventListener('click', () => {
                editProfilePopup.classList.remove('active');
            });
        }

        if (cancelBtn && editProfilePopup) {
            cancelBtn.addEventListener('click', () => {
                editProfilePopup.classList.remove('active');
            });
        }

        if (editProfilePopup) {
            editProfilePopup.addEventListener('click', (e) => {
                if (e.target === editProfilePopup) {
                    editProfilePopup.classList.remove('active');
                }
            });
        }
    } catch (error) {
        console.error('Error initializing:', error);
    }
});

// Function to handle profile picture change
function handleProfilePicChange(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const previewPic = document.getElementById('previewPic');
        if (!previewPic) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            previewPic.src = e.target.result;
        }
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Error handling profile picture:', error);
        showToast('Failed to update profile picture');
    }
}

// Function to handle form submission
function handleFormSubmit(event) {
    try {
        event.preventDefault();

        // Get form elements
        const usernameInput = document.getElementById('usernameInput');
        const nameInput = document.getElementById('nameInput');
        const mobileInput = document.getElementById('mobileInput');
        const locationInput = document.getElementById('locationInput');
        const emailInput = document.getElementById('emailInput');
        const previewPic = document.getElementById('previewPic');

        // Check if elements exist
        if (!usernameInput || !nameInput || !mobileInput || 
            !locationInput || !emailInput || !previewPic) {
            throw new Error('Required form elements not found');
        }

        const formData = {
            username: usernameInput.value,
            name: nameInput.value,
            mobile: mobileInput.value,
            location: locationInput.value,
            email: emailInput.value,
            profilePic: previewPic.src
        };

        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(formData));
        
        // Update display
        const usernameDisplay = document.getElementById('username');
        if (usernameDisplay) {
            usernameDisplay.textContent = formData.username;
        }

        // Update profile picture
        const profilePic = document.getElementById('profilePic');
        if (profilePic) {
            profilePic.src = formData.profilePic;
        }
        
        showToast('Profile updated successfully!');
        
        const editProfilePopup = document.getElementById('editProfilePopup');
        if (editProfilePopup) {
            editProfilePopup.classList.remove('active');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        showToast('Failed to update profile');
    }
}

// Function to handle settings clicks
 