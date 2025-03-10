// Reemplaza con tu API key real
const API_KEY = 'AIzaSyBdDsQeeEx1G4SPw--o-Gduthoe6K1XH1A';

const searchBtn = document.getElementById('searchBtn');
const channelUrlInput = document.getElementById('channelUrl');
const messageDiv = document.getElementById('message');
const channelContainer = document.getElementById('channelContainer');
const postsDiv = document.getElementById('posts');
const videoModal = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');
const numericPagination = document.getElementById('numericPagination');
const prevIcon = document.getElementById('prevIcon');
const nextIcon = document.getElementById('nextIcon');

// Configuración global para mostrar/ocultar detalles en los videos
let videoDetailsConfig = {
  showTitle: true,
  showViews: true,
  showLikes: true,
  showDate: true,
  showDescription: true,
  showComments: true
};

// Variables para paginación
let currentVideos = [];
let currentPage = 1;
const videosPerPage = 3;
let totalPages = 1;

// Panel colapsable de opciones
const detailsHeader = document.getElementById('detailsHeader');
const detailsContent = document.getElementById('detailsContent');
detailsHeader.addEventListener('click', () => {
  if(detailsContent.style.display === "block"){
    detailsContent.style.display = "none";
    detailsHeader.querySelector("i").innerText = "▼";
  } else {
    detailsContent.style.display = "block";
    detailsHeader.querySelector("i").innerText = "▲";
  }
});

// Event listeners para las opciones de detalle
const optTitle = document.getElementById('optTitle');
const optViews = document.getElementById('optViews');
const optLikes = document.getElementById('optLikes');
const optDate = document.getElementById('optDate');
const optDescription = document.getElementById('optDescription');
const optComments = document.getElementById('optComments');

optTitle.addEventListener('change', () => { 
  videoDetailsConfig.showTitle = optTitle.checked; 
  renderVideosContent(); 
});
optViews.addEventListener('change', () => { 
  videoDetailsConfig.showViews = optViews.checked; 
  renderVideosContent(); 
});
optLikes.addEventListener('change', () => { 
  videoDetailsConfig.showLikes = optLikes.checked; 
  renderVideosContent(); 
});
optDate.addEventListener('change', () => { 
  videoDetailsConfig.showDate = optDate.checked; 
  renderVideosContent(); 
});
optDescription.addEventListener('change', () => { 
  videoDetailsConfig.showDescription = optDescription.checked; 
  renderVideosContent(); 
});
optComments.addEventListener('change', () => { 
  videoDetailsConfig.showComments = optComments.checked; 
  renderVideosContent(); 
});

// Buscar canal al hacer clic en "Buscar"
searchBtn.addEventListener('click', () => {
  const url = channelUrlInput.value.trim();
  if (url === '') {
    alert('Por favor, ingresa la URL del canal.');
    return;
  }
  let channelId = null;
  // Caso 1: URL con "/channel/" (ID directo)
  const channelMatch = url.match(/youtube\.com\/channel\/([^\/\?\&]+)/);
  if (channelMatch && channelMatch[1]) {
    channelId = channelMatch[1];
    getChannelById(channelId);
    return;
  }
  // Caso 2: URL con handle (ej. "youtube.com/@nevert21")
  const handleMatch = url.match(/youtube\.com\/@([^\/\?\&]+)/);
  if (handleMatch && handleMatch[1]) {
    const handle = handleMatch[1];
    searchChannelByHandle(handle);
    return;
  }
  alert('La URL ingresada no es válida o no contiene un formato reconocido.');
});

async function searchChannelByHandle(handle) {
  messageDiv.innerText = 'Buscando canal por handle...';
  try {
    const query = '@' + handle;
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&key=${API_KEY}`
    );
    const searchData = await searchResponse.json();
    if (searchData.items && searchData.items.length > 0) {
      const channelItem = searchData.items[0];
      const channelId = channelItem.id.channelId;
      getChannelById(channelId);
    } else {
      messageDiv.innerText = 'No se encontró ningún canal con ese handle.';
    }
  } catch (error) {
    console.error(error);
    messageDiv.innerText = 'Ocurrió un error al buscar el canal por handle.';
  }
}

async function getChannelById(channelId) {
  messageDiv.innerText = 'Buscando canal...';
  try {
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings,statistics&id=${channelId}&key=${API_KEY}`
    );
    const channelData = await channelResponse.json();
    if (channelData.items && channelData.items.length > 0) {
      const channel = channelData.items[0];
      const channelTitle = channel.snippet.title;
      const channelThumbnail = channel.snippet.thumbnails.default.url;
      const subscribeLink = `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`;
      const bannerUrl = channel.brandingSettings?.image?.bannerExternalUrl || '';
      const subsCount = channel.statistics?.subscriberCount || 'N/A';
      const handle = '@' + channelTitle.replace(/\s+/g, '');
      const profileColor = channel.brandingSettings?.channel?.profileColor || '#f0f0f0';
      updatePaletteFromChannel(profileColor);
      renderChannel({channelId, channelTitle, channelThumbnail, subscribeLink, bannerUrl, subsCount, handle});
      
      // Cambia el fondo del contenedor a #1a3a51 al cargar un canal válido
      document.querySelector('.cards-container').style.backgroundColor = '#1a3a51';
      
      messageDiv.innerText = '';
      fetchVideos(channelId);
    } else {
      messageDiv.innerText = 'No se encontró el canal con ese ID.';
    }
  } catch (error) {
    console.error(error);
    messageDiv.innerText = 'Ocurrió un error al buscar el canal.';
  }
}

function updatePaletteFromChannel(primaryColor) {
  document.documentElement.style.setProperty('--profile-color', primaryColor);
  document.documentElement.style.setProperty('--primary-color', primaryColor);
  document.documentElement.style.setProperty('--secondary-color', shadeColor(primaryColor, -10));
}

function shadeColor(color, percent) {
  color = color.replace(/^#/, '');
  const num = parseInt(color, 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
  return "#" + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255)*0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255)*0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

function renderChannel(info) {
  if(!info) return;
  channelContainer.innerHTML = 
    `<div class="alternative-channel-header" style="background-image: url('${info.bannerUrl}');">
      <div class="channel-avatar">
        <a href="https://www.youtube.com/channel/${info.channelId}" target="_blank">
          <img src="${info.channelThumbnail}" alt="Foto de perfil">
        </a>
      </div>
      <div class="channel-info">
        <h2>${info.channelTitle}</h2><br>
        <span>${formatNumber(info.subsCount)} suscriptores</span><br><br>
        <button class="subscribe-btn" onclick="window.open('${info.subscribeLink}','_blank')">Suscribirse</button>
      </div>
    </div>`;
}

function formatNumber(num) {
  if (!num || isNaN(num)) return num;
  return Number(num).toLocaleString('es');
}

async function fetchVideos(channelId) {
  try {
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50&type=video`
    );
    const videosData = await videosResponse.json();
    if (videosData.items && videosData.items.length > 0) {
      const videoIds = videosData.items.map(item => item.id.videoId).join(',');
      // Se incluye contentDetails para obtener la duración
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
      );
      const detailsData = await detailsResponse.json();
      currentVideos = detailsData.items;
      currentPage = 1;
      totalPages = Math.ceil(currentVideos.length / videosPerPage);
      renderVideosContent();
    } else {
      postsDiv.innerHTML = '<p style="color: #000;">No se encontraron videos.</p>';
      numericPagination.style.display = "block";
      prevIcon.style.display = "none";
      nextIcon.style.display = "none";
    }
  } catch (error) {
    console.error(error);
    postsDiv.innerHTML = '<p style="color: #000;">Ocurrió un error al cargar los videos.</p>';
    numericPagination.style.display = "block";
    prevIcon.style.display = "none";
    nextIcon.style.display = "none";
  }
}

// Renderiza el contenido de videos sin animación
function renderVideosContent() {
  postsDiv.innerHTML = "";
  
  const startIndex = (currentPage - 1) * videosPerPage;
  const endIndex = startIndex + videosPerPage;
  const videosToShow = currentVideos.slice(startIndex, endIndex);
  
  videosToShow.forEach(video => {
    const videoId = video.id;
    const title = video.snippet.title;
    const description = video.snippet.description;
    const publishedAt = video.snippet.publishedAt;
    const thumbnail = video.snippet.thumbnails.high.url;
    const likeCount = video.statistics.likeCount || '0';
    const viewCount = video.statistics.viewCount || '0';
    const commentCount = video.statistics.commentCount || '0';
    const formattedDate = new Date(publishedAt).toLocaleDateString('es-ES');
    const isoDuration = video.contentDetails.duration;
    const durationText = parseDuration(isoDuration);
    
    let overlayHTML = `<div class="video-overlay-content">`;
    if(videoDetailsConfig.showDate){
      overlayHTML += `<p class="video-date">${formattedDate}</p>`;
    }
    if(videoDetailsConfig.showTitle){
      overlayHTML += `<h3 class="video-title">${title}</h3>`;
    }
    if(videoDetailsConfig.showDescription){
      overlayHTML += `<p class="video-description">${description.substring(0,80)}...</p>`;
    }
    if(videoDetailsConfig.showViews){
      overlayHTML += `<p class="video-views">Vistas: ${formatNumber(viewCount)}</p>`;
    }
    if(videoDetailsConfig.showLikes){
      overlayHTML += `<p class="video-likes">Likes: ${formatNumber(likeCount)}</p>`;
    }
    if(videoDetailsConfig.showComments){
      overlayHTML += `<p class="video-comments">Comentarios: ${formatNumber(commentCount)}</p>`;
    }
    overlayHTML += `</div>`;
    
    const col = document.createElement('div');
    col.className = 'col-md-4';
    const videoCard = document.createElement('div');
    videoCard.className = 'video-card';
    videoCard.innerHTML = `<img src="${thumbnail}" alt="${title}">` +
                          `<div class="video-duration">${durationText}</div>` +
                          `<div class="video-overlay">${overlayHTML}</div>`;
    videoCard.addEventListener('click', () => openModal(video));
    col.appendChild(videoCard);
    postsDiv.appendChild(col);
  });
  
  renderNumericPagination();
  updateNavButtons();
}

// Botones de paginación sin animación: actualiza la página y renderiza el contenido
prevIcon.addEventListener('click', () => {
  if(currentPage > 1){
    currentPage--;
    renderVideosContent();
  }
});

nextIcon.addEventListener('click', () => {
  if(currentPage < totalPages){
    currentPage++;
    renderVideosContent();
  }
});

// Renderiza la paginación numérica y vincula sus botones sin animación
function renderNumericPagination() {
  numericPagination.innerHTML = "";
  numericPagination.style.display = "block"; // Siempre visible
  const windowContainer = document.createElement('div');
  windowContainer.className = 'pagination-window';
  
  // Calcular ventana de números
  let start = 1, end = totalPages;
  if(totalPages > 3){
    if(currentPage === 1){
      start = 1;
      end = 3;
    } else if(currentPage === totalPages){
      start = totalPages - 2;
      end = totalPages;
    } else {
      start = currentPage - 1;
      end = currentPage + 1;
    }
  }
  
  if(start > 1){
    const btnPrevSet = document.createElement('button');
    btnPrevSet.innerText = '«';
    btnPrevSet.classList.add('set-nav');
    btnPrevSet.addEventListener('click', () => {
      currentPage = start - 1;
      renderVideosContent();
    });
    windowContainer.appendChild(btnPrevSet);
  }
  
  for(let i = start; i <= end; i++){
    const btn = document.createElement('button');
    btn.innerText = i;
    if(i === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if(i !== currentPage){
        currentPage = i;
        renderVideosContent();
      }
    });
    windowContainer.appendChild(btn);
  }
  
  if(end < totalPages){
    const btnNextSet = document.createElement('button');
    btnNextSet.innerText = '»';
    btnNextSet.classList.add('set-nav');
    btnNextSet.addEventListener('click', () => {
      currentPage = end + 1;
      renderVideosContent();
    });
    windowContainer.appendChild(btnNextSet);
  }
  
  const ytIcon = document.createElement('div');
  ytIcon.className = 'youtube-icon';
  ytIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="#FF0000"></svg>`;
  const frag = document.createDocumentFragment();
  frag.appendChild(windowContainer);
  frag.appendChild(ytIcon);
  numericPagination.appendChild(frag);
}

function updateNavButtons() {
  prevIcon.style.display = (currentPage === 1) ? "none" : "flex";
  nextIcon.style.display = (currentPage === totalPages) ? "none" : "flex";
}

/**
 * Abre el modal mostrando el reproductor, detalles y comentarios.
 */
function openModal(video) {
  const videoId = video.id;
  const title = video.snippet.title;
  const description = video.snippet.description;
  const publishedAt = video.snippet.publishedAt;
  const likeCount = video.statistics.likeCount || '0';
  const viewCount = video.statistics.viewCount || '0';
  const formattedDate = new Date(publishedAt).toLocaleDateString('es-ES');
  
  let modalHTML = 
    `<div class="video-player">
      <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
    </div>`;
    
  if (videoDetailsConfig.showTitle) {
    modalHTML += `<h2 class="video-title">${title}</h2>`;
  }
  if (videoDetailsConfig.showDate) {
    modalHTML += `<p class="video-date">publicado el ${formattedDate}</p>`;
  }
  if (videoDetailsConfig.showDescription) {
    modalHTML += `<p class="video-description" style="white-space: pre-line;">${description}</p>`;
  }
  modalHTML += `<div class="video-stats">`;
  if (videoDetailsConfig.showViews) {
    modalHTML += `<span class="video-views">${formatNumber(viewCount)}</span>`;
  }
  if (videoDetailsConfig.showLikes) {
    modalHTML += `<span class="video-likes">${formatNumber(likeCount)}</span>`;
  }
  modalHTML += `</div>`;
  
  modalHTML += `<div class="video-comments" id="modalComments">Cargando comentarios...</div>`;
  
  modalBody.innerHTML = modalHTML;
  videoModal.style.display = 'flex';
  
  fetchComments(videoId, document.getElementById('modalComments'));
}

/**
 * Cierra el modal al presionar el botón de cerrar.
 */
modalClose.addEventListener('click', () => {
  videoModal.style.display = 'none';
  modalBody.innerHTML = '';
});

/**
 * Cierra el modal al hacer clic fuera del contenido.
 */
window.addEventListener('click', (e) => {
  if (e.target === videoModal) {
    videoModal.style.display = 'none';
    modalBody.innerHTML = '';
  }
});

/**
 * Carga y muestra los comentarios.
 */
async function fetchComments(videoId, container) {
  try {
    const commentsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${API_KEY}&maxResults=20`
    );
    const commentsData = await commentsResponse.json();
    if (commentsData.items && commentsData.items.length > 0) {
      let commentsHTML = '';
      commentsData.items.forEach(item => {
        const comment = item.snippet.topLevelComment.snippet;
        commentsHTML += 
          `<div class="video-comment">
            <img src="${comment.authorProfileImageUrl}" alt="${comment.authorDisplayName}">
            <div class="video-comment-content">
              <div class="video-comment-author">${comment.authorDisplayName}</div>
              <div class="video-comment-text">${comment.textDisplay}</div>
            </div>
          </div>`;
      });
      container.innerHTML = commentsHTML;
    } else {
      container.innerHTML = 'No hay comentarios.';
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = 'Error al cargar comentarios.';
  }
}

/**
 * Convierte la duración ISO8601 en formato legible.
 */
function parseDuration(isoDuration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  let hours = parseInt(matches[1]) || 0;
  let minutes = parseInt(matches[2]) || 0;
  let seconds = parseInt(matches[3]) || 0;
  const pad = num => String(num).padStart(2, '0');
  if(hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    return `${minutes}:${pad(seconds)}`;
  }
}

// Carga del header HTML
fetch("/caso5/htmls/header.html")
  .then(response => response.text())
  .then(data => document.getElementById("contenido").innerHTML = data)
  .catch(error => console.error("Error al cargar el HTML:", error));
