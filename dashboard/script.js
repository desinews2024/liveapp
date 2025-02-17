document.addEventListener('DOMContentLoaded', function () {
    const navItems = document.querySelectorAll('.nav-item, .redirect-btn'); // Fact Check button bhi include karein
    const sections = document.querySelectorAll('.content-section');

    function switchTab(newSection) {
        if (!newSection) return;

        // Sabhi sections ko hide karein
        sections.forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        // Naya section show karein
        const newEl = document.getElementById(`${newSection}-section`);
        if (newEl) {
            newEl.classList.add('active');
            newEl.style.display = 'block';
        }

        // Active state update karein
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === newSection);
        });

        // URL update karein
        history.pushState({ section: newSection }, '', `#${newSection}`);
    }

    // Nav aur button par event listener lagayein
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                switchTab(section);
            }
        });
    });

    // Back button support
    window.addEventListener('popstate', function (event) {
        const section = event.state?.section || 'home';
        switchTab(section);
    });

    // Initial load ke liye URL hash check karein
    const hash = window.location.hash.substring(1);
    switchTab(hash || 'home');
});

// Navigation handling
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        if (this.dataset.section === 'upload') return; // Skip for upload button
        
        e.preventDefault();
        const sectionId = this.dataset.section;
        
        // Remove active class from all sections and nav items
        document.querySelectorAll('.content-section, .nav-item').forEach(el => {
            el.classList.remove('active');
        });
        
        // Add active class to clicked nav item and corresponding section
        this.classList.add('active');
        document.getElementById(`${sectionId}-section`).classList.add('active');
    });
});

// Video Upload Modal Functions
function openUploadModal() {
    document.getElementById('uploadModal').style.display = 'block';
    document.getElementById('overlay').classList.remove('hidden');
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('overlay').classList.add('hidden');
    // Reset form
    document.getElementById('uploadForm').reset();
    document.getElementById('videoPreview').style.display = 'none';
}

// Video Preview
document.getElementById('videoFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const videoPreview = document.getElementById('videoPreview');
    
    if (file) {
        const videoUrl = URL.createObjectURL(file);
        videoPreview.src = videoUrl;
        videoPreview.style.display = 'block';
    }
});

// Handle Form Submission
document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    showLoading();

    const formData = new FormData();
    formData.append('video', document.getElementById('videoFile').files[0]);
    formData.append('title', document.getElementById('videoTitle').value);
    formData.append('summary', document.getElementById('videoSummary').value);
    formData.append('category', document.getElementById('videoCategory').value);
    formData.append('location', document.getElementById('videoLocation').value);
    formData.append('userId', localStorage.getItem('userId') || 'anonymous');

    try {
        const response = await fetch('/api/upload-video', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const result = await response.json();
        addVideoToFeed(result);
        closeUploadModal();
        showNotification('Video uploaded successfully!');
    } catch (error) {
        showNotification('Error uploading video: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
});

// Load Videos in Feed
async function loadVideos() {
    try {
        const response = await fetch('/api/videos');
        const videos = await response.json();
        
        const feedItems = document.querySelector('.feed-items');
        feedItems.innerHTML = ''; // Clear existing items
        
        videos.forEach(video => addVideoToFeed(video));
    } catch (error) {
        showNotification('Error loading videos: ' + error.message, 'error');
    }
}

// Add Video to Feed
function addVideoToFeed(videoData) {
    const feedItems = document.querySelector('.feed-items');
    const videoPost = document.createElement('div');
    videoPost.className = 'video-post';
    videoPost.innerHTML = `
        <div class="post-header">
            <div class="user-info">
                <img src="${videoData.userProfile}" alt="User Profile" class="profile-pic">
                <span class="username">${videoData.username}</span>
            </div>
            <div class="post-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${videoData.location}</span>
            </div>
        </div>
        <div class="video-container">
            <video controls>
                <source src="${videoData.videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
        <div class="post-actions">
            <button class="action-btn like-btn" onclick="toggleLike(this, ${videoData.id})">
                <i class="far fa-heart"></i>
                <span>${videoData.likes}</span>
            </button>
            <button class="action-btn comment-btn" onclick="toggleComments(${videoData.id})">
                <i class="far fa-comment"></i>
                <span>${videoData.comments.length}</span>
            </button>
            <button class="action-btn share-btn" onclick="shareVideo('${videoData.videoUrl}')">
                <i class="far fa-share-square"></i>
            </button>
        </div>
        <div class="post-summary">
            <p class="username">${videoData.username}</p>
            <p class="summary-text">${videoData.summary}</p>
        </div>
        <div class="comments-section" id="comments-${videoData.id}">
            <div class="comments-list">
                ${videoData.comments.map(comment => `
                    <div class="comment">
                        <span class="comment-username">${comment.username}</span>
                        <span class="comment-text">${comment.text}</span>
                    </div>
                `).join('')}
            </div>
            <div class="add-comment">
                <input type="text" placeholder="Add a comment..." id="comment-input-${videoData.id}">
                <button onclick="addComment(${videoData.id})">Post</button>
            </div>
        </div>
    `;
    feedItems.insertBefore(videoPost, feedItems.firstChild);
}

// Like, Comment, and Share Functions
function toggleLike(button, videoId) {
    const likeIcon = button.querySelector('i');
    const likeCount = button.querySelector('span');
    
    if (likeIcon.classList.contains('far')) {
        likeIcon.classList.replace('far', 'fas');
        likeIcon.style.color = '#ed4956';
        likeCount.textContent = parseInt(likeCount.textContent) + 1;
    } else {
        likeIcon.classList.replace('fas', 'far');
        likeIcon.style.color = '';
        likeCount.textContent = parseInt(likeCount.textContent) - 1;
    }
}

function toggleComments(videoId) {
    const commentsSection = document.getElementById(`comments-${videoId}`);
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
}

async function addComment(videoId) {
    const input = document.getElementById(`comment-input-${videoId}`);
    const comment = input.value.trim();
    
    if (comment) {
        try {
            // In a real app, you would send this to your backend
            const commentsList = document.querySelector(`#comments-${videoId} .comments-list`);
            const newComment = document.createElement('div');
            newComment.className = 'comment';
            newComment.innerHTML = `
                <span class="comment-username">User</span>
                <span class="comment-text">${comment}</span>
            `;
            commentsList.appendChild(newComment);
            input.value = '';
        } catch (error) {
            showNotification('Error adding comment: ' + error.message, 'error');
        }
    }
}

async function shareVideo(videoUrl) {
    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Check out this video!',
                url: videoUrl
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            await navigator.clipboard.writeText(videoUrl);
            showNotification('Video link copied to clipboard!');
        }
    } catch (error) {
        showNotification('Error sharing video: ' + error.message, 'error');
    }
}

// Utility Functions
function showNotification(message, type = 'success') {
    // You can implement a proper notification system here
    alert(message);
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Load videos when the feed section becomes active
document.querySelector('[data-section="feed"]').addEventListener('click', loadVideos);

// Initial load if we're starting on the feed section
if (document.querySelector('#feed-section').classList.contains('active')) {
    loadVideos();
}
