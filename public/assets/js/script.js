document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                section.style.transform = 'scale(1.02)';
            } else {
                section.style.transform = 'scale(1)';
            }
        });
    });
});

// Lógica para passar o slide no carrossel
const track = document.querySelector('.carousel-track');
// const slides = Array.from(track.children);
const nextButton = document.querySelector('.next-slide');
const prevButton = document.querySelector('.prev-slide');
const dotsNav = document.querySelector('.carousel-nav');
// let slideWidth = slides[0].getBoundingClientRect().width;

// let slidesToShow = window.innerWidth > 768 ? 3 : 1;
let currentIndex = 0;

// Função para atualizar os indicadores de navegação
const updateDotsNav = () => {
    const totalPages = Math.ceil(slides.length / slidesToShow);
    dotsNav.innerHTML = ''; // Limpa os indicadores existentes

    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('button');
        dot.classList.add('carousel-indicator');
        if (i === Math.floor(currentIndex / slidesToShow)) {
            dot.classList.add('current-slide');
        }
        dotsNav.appendChild(dot);
    }
};

// Movimenta o carrossel para o slide desejado
const moveToSlide = (index) => {
    track.style.transform = 'translateX(-' + (slideWidth * index) + 'px)';
    currentIndex = index;
    updateDotsNav(); // Atualiza os indicadores após mover o slide
};

// ativa hamburguer menu lateral
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('header nav ul');

    // Abre ou fecha o menu ao clicar no botão de toggle
    menuToggle.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que o clique se propague
        menu.classList.toggle('showing');
    });

    // Fecha o menu ao clicar fora dele
    document.addEventListener('click', (event) => {
        const isClickInsideMenu = menu.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);

        if (!isClickInsideMenu && !isClickOnToggle) {
            menu.classList.remove('showing');
        }
    });
});

// Fecha o menu ao selecionar alguma seção
document.querySelectorAll('header nav ul li a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('header nav ul').classList.remove('showing');
    });
});
