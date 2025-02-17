const FACT_CHECK_API_KEY = 'AIzaSyCM2QXH3oEHurEokRnlf3dos8Qpf_WyJ94';
const TRANSLATE_API_KEY = 'YOUR_VALID_API_KEY_HERE'; // Google Translate API Key
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const languageSelect = document.getElementById('languageSelect');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error');
const resultsContainer = document.getElementById('results');

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    
    // Update button icon
    const isDarkMode = body.classList.contains('dark-mode');
    darkModeToggle.innerHTML = isDarkMode 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
    
    // Save user preference
    localStorage.setItem('darkMode', isDarkMode);
});

// Check for saved user preference
const savedDarkMode = localStorage.getItem('darkMode') === 'true';
if (savedDarkMode) {
    body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// डिफ़ॉल्ट भाषा और प्लेसहोल्डर सेट करें
document.addEventListener('DOMContentLoaded', () => {
    if (languageSelect) {
        languageSelect.value = 'hi';
    }
    searchInput.placeholder = "भारतीय समाचार सत्यापित करने के लिए टाइप करें...";
    displaySavedResults();
});

// Save search results to localStorage
function saveSearchResults(results) {
    localStorage.setItem('lastSearchResults', JSON.stringify(results));
}

// Load search results from localStorage
function loadSearchResults() {
    const results = localStorage.getItem('lastSearchResults');
    return results ? JSON.parse(results) : null;
}

// Display results from localStorage
function displaySavedResults() {
    const savedResults = loadSearchResults();
    if (savedResults) {
        displayResults(savedResults);
    }
}

// सर्च फॉर्म सबमिशन
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    
    if (!query) return;

    showLoading();
    clearResults();

    try {
        const articles = await fetchFactCheckResults(query);
        saveSearchResults(articles); // Save results to localStorage
        displayResults(articles);
    } catch (error) {
        showError('परिणाम प्राप्त करने में विफल। कृपया पुनः प्रयास करें।');
        console.error('Error:', error);
    } finally {
        hideLoading();
    }
});

// Fact Check API से डेटा प्राप्त करें
async function fetchFactCheckResults(query) {
    const response = await fetch(
        `https://factchecktools.googleapis.com/v1alpha1/claims:search?` +
        `query=${encodeURIComponent(query)}&` +
        `key=${FACT_CHECK_API_KEY}&` +
        `languageCode=hi`
    );
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Details:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data); // डिबगिंग के लिए
    return data.claims || [];
}

// Google Translate API का उपयोग करके टेक्स्ट को हिंदी में ट्रांसलेट करें
async function translateToHindi(text) {
    if (!text || !TRANSLATE_API_KEY) return text;

    try {
        const response = await fetch(
            `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATE_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    q: text,
                    target: 'hi',
                    source: 'en'
                })
            }
        );

        const data = await response.json();
        return data.data.translations[0].translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
}

// सभी आर्टिकल्स को हिंदी में ट्रांसलेट करें
async function translateArticles(articles) {
    return await Promise.all(articles.map(async (article) => {
        const translatedText = await translateToHindi(article.text);
        const translatedRating = article.claimReview?.[0]?.textualRating
            ? await translateToHindi(article.claimReview[0].textualRating)
            : 'रेटिंग नहीं की गई';

        return {
            ...article,
            text: translatedText,
            claimReview: article.claimReview?.map(review => ({
                ...review,
                textualRating: translatedRating
            }))
        };
    }));
}

// परिणामों को प्रदर्शित करें
function displayResults(claims) {
    if (!claims.length) {
        showError('आपकी खोज के लिए कोई परिणाम नहीं मिला। कृपया अन्य कीवर्ड्स के साथ प्रयास करें।');
        return;
    }

    claims.forEach(claim => {
        const card = createResultCard(claim);
        resultsContainer.appendChild(card);
    });
}

// प्रत्येक परिणाम के लिए कार्ड बनाएँ
function createResultCard(claim) {
    const review = claim.claimReview?.[0];
    const card = document.createElement('div');
    card.className = 'result-card';

    // रेटिंग का हिंदी अनुवाद
    const rating = review?.textualRating || 'Not Rated';
    const translatedRating = translateRating(rating);

    // फैक्ट चेक स्रोत का नाम
    const publisher = review?.publisher?.name || 'अज्ञात स्रोत';

    card.innerHTML = `
        <h2>${claim.text}</h2>
        <p class="status">स्थिति: ${translatedRating}</p>
        <div class="fact-check-info">
            <p class="source">फैक्ट चेक स्रोत: ${publisher}</p>
            <p class="date">प्रकाशन तिथि: ${formatDate(review?.reviewDate)}</p>
        </div>
        <div class="card-footer">
            <a href="#" class="read-more" data-url="${review?.url || '#'}">
                विस्तृत जानकारी पढ़ें
            </a>
        </div>
    `;

    return card;
}

// रेटिंग का हिंदी अनुवाद
function translateRating(rating) {
    const translations = {
        'True': 'सत्य',
        'False': 'असत्य',
        'Mostly True': 'अधिकांशतः सत्य',
        'Mostly False': 'अधिकांशतः असत्य',
        'Half True': 'आधा सत्य',
        'Partially True': 'आंशिक रूप से सत्य',
        'Partially False': 'आंशिक रूप से असत्य',
        'Not Rated': 'रेटिंग नहीं की गई',
        'Misleading': 'भ्रामक',
        'Unverified': 'असत्यापित',
        'Missing Context': 'संदर्भ की कमी',
        'False Claim': 'गलत दावा',
        'Pants on Fire': 'पूर्णतः असत्य',
        'Fake': 'फर्जी',
        'Viral': 'वायरल',
        'Rumour': 'अफवाह'
    };
    return translations[rating] || rating;
}

// दिनांक को हिंदी में फॉर्मेट करें
function formatDate(dateString) {
    if (!dateString) return 'तिथि उपलब्ध नहीं';
    
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    return date.toLocaleDateString('hi-IN', options);
}

// Function to show loading spinner
function showLoading() {
    document.getElementById('loading').classList.add('show');
}

// Function to hide loading spinner
function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function clearResults() {
    resultsContainer.innerHTML = '';
    errorMessage.classList.add('hidden');
}

// Internal Page Navigation
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('read-more')) {
        e.preventDefault();
        const url = e.target.getAttribute('data-url');
        if (url && url !== '#') {
            window.location.href = url;
        }
    }
});
