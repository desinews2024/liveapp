import { 
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    db,
    collection,
    addDoc,
    getDocs,
    query,
    where
} from './firebase-config.js';

export function initializeAuth() {
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const mobile = document.getElementById('regMobile').value.trim();
    const password = document.getElementById('regPassword').value;
    const privacyPolicy = document.getElementById('privacyPolicy').checked;

    if (!name || !email || !mobile || !password) {
        showToast('कृपया सभी फ़ील्ड भरें', 'error');
        return;
    }

    if (mobile.length !== 10) {
        showToast('कृपया सही मोबाइल नंबर दर्ज करें', 'error');
        return;
    }

    if (!privacyPolicy) {
        showToast('कृपया नियम और शर्तें स्वीकार करें', 'error');
        return;
    }

    try {
        const registerButton = document.getElementById('registerButton');
        registerButton.disabled = true;
        registerButton.textContent = 'रजिस्टर हो रहा है...';

        // Check if mobile already exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("mobile", "==", mobile));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            showToast('यह मोबाइल नंबर पहले से रजिस्टर्ड है', 'error');
            return;
        }

        // Save user data directly to Firestore
        await addDoc(collection(db, 'users'), {
            username: name,
            email,
            mobile,
            password,
            isVerified: true,
            createdAt: new Date().toISOString()
        });

        showToast('रजिस्ट्रेशन सफल!', 'success');
        
        // Clear form
        document.getElementById('registerFormElement').reset();
        
        // Switch to login form
        setTimeout(() => {
            switchForm('loginForm');
        }, 1000);

    } catch (error) {
        console.error('Registration error:', error);
        showToast('रजिस्ट्रेशन में त्रुटि। कृपया पुनः प्रयास करें।', 'error');
    } finally {
        const registerButton = document.getElementById('registerButton');
        registerButton.disabled = false;
        registerButton.textContent = 'Register';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const mobileInput = document.getElementById('loginMobile');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!mobileInput || !passwordInput) {
        showToast('System error. Please try again.', 'error');
        return;
    }

    const mobile = mobileInput.value.trim();
    const password = passwordInput.value;

    if (!mobile || !password) {
        showToast('कृपया मोबाइल नंबर और पासवर्ड दर्ज करें', 'error');
        return;
    }

    if (mobile.length !== 10) {
        showToast('कृपया सही मोबाइल नंबर दर्ज करें', 'error');
        return;
    }

    try {
        const loginButton = document.querySelector('#loginFormElement button[type="submit"]');
        if (loginButton) {
            loginButton.disabled = true;
            loginButton.textContent = 'लॉगिन हो रहा है...';
        }

        // Find user by mobile
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("mobile", "==", mobile));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            showToast('यह मोबाइल नंबर रजिस्टर्ड नहीं है', 'error');
            return;
        }

        // Verify password
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.password !== password) {
            showToast('गलत पासवर्ड', 'error');
            return;
        }

        // Store user data with auth info
        const userAuthData = {
            isLoggedIn: true,
            username: userData.username,
            mobile: userData.mobile,
            isVerified: userData.isVerified,
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        localStorage.setItem('userAuth', JSON.stringify(userAuthData));
        
        showToast('लॉगिन सफल!', 'success');
        
        // Immediate redirect to dashboard
        window.location.href = 'dashboard/index.html';

    } catch (error) {
        console.error('Login error:', error);
        showToast('लॉगिन में त्रुटि। कृपया पुनः प्रयास करें।', 'error');
    } finally {
        const loginButton = document.querySelector('#loginFormElement button[type="submit"]');
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    }
}

function showToast(message, type = 'info') {
    Swal.fire({
        text: message,
        icon: type,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
}

// Make switchForm available globally
window.switchForm = switchForm;

