// Case Study Page functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    if (!projectId) {
        // Redirect to main page if no ID
        window.location.href = 'index.html#project-map';
        return;
    }
    
    // Load project data
    loadProjectData(projectId);
});

async function loadProjectData(projectId) {
    try {
        const response = await fetch('assets/data/projects.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const projects = await response.json();
        const projectIdNum = parseInt(projectId, 10);
        if (isNaN(projectIdNum)) {
            throw new Error('Invalid project ID');
        }
        const project = projects.find(p => p.id === projectIdNum);
        
        if (!project) {
            window.location.href = 'index.html#project-map';
            return;
        }
        
        // Populate page with project data - with null checks
        const elements = {
            caseStudyTitle: document.getElementById('caseStudyTitle'),
            caseTitle: document.getElementById('caseTitle'),
            caseLocation: document.getElementById('caseLocation'),
            caseDate: document.getElementById('caseDate'),
            caseType: document.getElementById('caseType'),
            caseChallenge: document.getElementById('caseChallenge'),
            caseSolution: document.getElementById('caseSolution'),
            caseArea: document.getElementById('caseArea'),
            caseClient: document.getElementById('caseClient')
        };
        
        if (elements.caseStudyTitle) elements.caseStudyTitle.textContent = project.title || 'Проект';
        if (elements.caseTitle) elements.caseTitle.textContent = project.title || 'Кейс проекта';
        if (elements.caseLocation) elements.caseLocation.textContent = project.location || '-';
        if (elements.caseDate) elements.caseDate.textContent = project.date || '-';
        if (elements.caseType) elements.caseType.textContent = getServiceTypeName(project.type);
        if (elements.caseChallenge) elements.caseChallenge.textContent = project.challenge || 'Не указано';
        if (elements.caseSolution) elements.caseSolution.textContent = project.solution || 'Не указано';
        if (elements.caseArea) elements.caseArea.textContent = project.area || '-';
        if (elements.caseClient) elements.caseClient.textContent = project.client || '-';
        
        // Results list
        const resultsList = document.getElementById('caseResults');
        if (resultsList && project.results && project.results.length > 0) {
            resultsList.innerHTML = '';
            project.results.forEach(result => {
                const li = document.createElement('li');
                li.textContent = result;
                resultsList.appendChild(li);
            });
        }
        
        // Photos
        if (project.photos && project.photos.length > 0) {
            const photosSection = document.getElementById('casePhotos');
            const photosGrid = document.getElementById('casePhotosGrid');
            photosSection.style.display = 'block';
            photosGrid.innerHTML = '';
            project.photos.forEach(photo => {
                const img = document.createElement('img');
                img.src = photo;
                img.alt = project.title;
                img.loading = 'lazy';
                img.addEventListener('click', () => openPhotoModal(photo));
                photosGrid.appendChild(img);
            });
        }
        
        // Update stats
        updateStats(project);
        
        // Load similar projects
        loadSimilarProjects(project);
        
        // Update structured data
        updateStructuredData(project);
    } catch (error) {
        // Log error silently and redirect
        window.location.href = 'index.html#project-map';
    }
}

function updateStats(project) {
    const statsSection = document.getElementById('caseStats');
    if (!statsSection) return;
    
    const statArea = document.getElementById('statArea');
    const statDeadline = document.getElementById('statDeadline');
    const statResults = document.getElementById('statResults');
    
    if (project.area) {
        if (statArea) statArea.textContent = project.area;
        statsSection.style.display = 'grid';
    }
    
    if (project.deadline) {
        if (statDeadline) statDeadline.textContent = project.deadline;
    } else if (project.date) {
        if (statDeadline) statDeadline.textContent = project.date;
    }
    
    if (project.results && project.results.length > 0) {
        if (statResults) statResults.textContent = project.results.length;
    }
}

async function loadSimilarProjects(currentProject) {
    try {
        const response = await fetch('assets/data/projects.json');
        if (!response.ok) return;
        
        const projects = await response.json();
        const similarProjects = projects
            .filter(p => p.id !== currentProject.id && p.type === currentProject.type)
            .slice(0, 3);
        
        if (similarProjects.length === 0) return;
        
        const similarSection = document.getElementById('similarProjects');
        const similarGrid = document.getElementById('similarProjectsGrid');
        
        if (!similarSection || !similarGrid) return;
        
        similarSection.style.display = 'block';
        similarGrid.innerHTML = '';
        
        similarProjects.forEach(project => {
            const card = document.createElement('a');
            card.href = `case-study.html?id=${project.id}`;
            card.className = 'similar-project-card';
            
            const image = document.createElement('img');
            image.className = 'similar-project-image';
            image.src = project.photos && project.photos.length > 0 
                ? project.photos[0] 
                : 'https://via.placeholder.com/300x180/2c5aa0/ffffff?text=' + encodeURIComponent(project.title);
            image.alt = project.title;
            image.loading = 'lazy';
            
            const content = document.createElement('div');
            content.className = 'similar-project-content';
            
            const title = document.createElement('div');
            title.className = 'similar-project-title';
            title.textContent = project.title;
            
            const meta = document.createElement('div');
            meta.className = 'similar-project-meta';
            meta.innerHTML = `
                <span>${project.location}</span>
                <span class="similar-project-type">${getServiceTypeName(project.type)}</span>
            `;
            
            content.appendChild(title);
            content.appendChild(meta);
            
            card.appendChild(image);
            card.appendChild(content);
            similarGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading similar projects:', error);
    }
}

function shareProject(platform) {
    const url = window.location.href;
    const title = document.getElementById('caseStudyTitle')?.textContent || 'Кейс проекта';
    
    if (platform === 'copy') {
        navigator.clipboard.writeText(url).then(() => {
            alert('Ссылка скопирована в буфер обмена!');
        }).catch(() => {
            alert('Не удалось скопировать ссылку');
        });
        return;
    }
    
    const shareUrls = {
        vk: `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    };
    
    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}

function getServiceTypeName(type) {
    const types = {
        'facade': 'Фасадная съемка',
        'laser': 'Лазерное сканирование',
        'construction': 'Строительная геодезия',
        'topography': 'Топографическая съемка',
        'survey': 'Геодезические изыскания'
    };
    return types[type] || type;
}

function updateStructuredData(project) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "CaseStudy",
        "name": project.title,
        "description": project.challenge || project.solution || '',
        "about": {
            "@type": "Thing",
            "name": getServiceTypeName(project.type)
        },
        "locationCreated": {
            "@type": "Place",
            "name": project.location
        },
        "datePublished": project.date || project.year?.toString(),
        "result": project.results?.map(r => ({
            "@type": "Thing",
            "name": r
        })) || [],
        "image": project.photos && project.photos.length > 0 ? project.photos[0] : undefined,
        "mainEntity": {
            "@type": "Project",
            "name": project.title,
            "description": project.challenge,
            "location": {
                "@type": "Place",
                "name": project.location
            }
        }
    };
    
    // Remove undefined fields
    Object.keys(structuredData).forEach(key => {
        if (structuredData[key] === undefined) {
            delete structuredData[key];
        }
    });
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
}

function openPhotoModal(photoSrc) {
    // Simple photo modal with XSS protection
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;cursor:pointer;';
    
    // Safe image creation to prevent XSS
    const img = document.createElement('img');
    img.src = photoSrc;
    img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;';
    img.alt = 'Project photo';
    modal.appendChild(img);
    
    modal.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
}
