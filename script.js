// Obtener elementos del DOM
const form = document.getElementById('formulario');
const listaDiv = document.getElementById('lista');
const contadorDiv = document.getElementById('contador');
const totalProductosP = document.getElementById('totalProductos');
const volverListaBtn = document.getElementById('volverLista');
const searchInput = document.querySelector('.search-box input');

const btnConfiguracion = document.getElementById('configuracion');
const btnPerfil = document.getElementById('perfil');
const btnCerrarSesion = document.getElementById('cerrarSesion');

const menuContador = document.querySelector('.sidebar .menu-item:first-child');

// Cargar productos guardados o crear lista vacía
let productos = JSON.parse(localStorage.getItem('productos')) || [];

// ===============================
// FUNCIONES
// ===============================

// Mostrar productos en pantalla
function mostrarProductos(listaAMostrar = productos) {
    listaDiv.innerHTML = '';
    const hoy = new Date();

    if (listaAMostrar.length === 0) {
        listaDiv.innerHTML = '<p>No hay productos.</p>';
        return;
    }

   // ...existing code...
    listaAMostrar.forEach(p => {
        const div = document.createElement('div');
        let texto = '';
        const fecha = new Date(p.fecha);
        const diasRestantes = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) {
            div.className = 'vencido';
            texto = `${p.nombre} - ❌ Vencido (${fecha.toLocaleDateString()})`;
        } else if (diasRestantes <= 3) {
            div.className = 'por-vencer';
            texto = `${p.nombre} - ⚠️ Por vencer (faltan ${diasRestantes} días)`;
        } else {
            div.className = 'ok';
            texto = `${p.nombre} - ✅ Vence el ${fecha.toLocaleDateString()}`;
        }

        div.textContent = texto;
        listaDiv.appendChild(div);
    });
// ...existing code...

    // Asegurarse de que la lista esté visible y contador oculto
    listaDiv.parentElement.style.display = 'block';
    contadorDiv.style.display = 'none';
}

// Función para enviar notificación
function enviarNotificacion(titulo, mensaje) {
    if (Notification.permission === "granted") {
        new Notification(titulo, { body: mensaje });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(titulo, { body: mensaje });
            }
        });
    }
}

// Verificar vencimientos y enviar notificaciones
function verificarVencimientos() {
    const hoy = new Date();
    productos.forEach(p => {
        const fecha = new Date(p.fecha);
        const diasRestantes = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) {
            enviarNotificacion("Producto vencido ❌", `${p.nombre} venció el ${fecha.toLocaleDateString()}`);
        } else if (diasRestantes <= 3) {
            enviarNotificacion("Producto por vencer ⚠️", `${p.nombre} vence en ${diasRestantes} días`);
        }
    });
}

// ===============================
// EVENTOS
// ===============================

// Formulario para agregar productos
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const fecha = document.getElementById('fecha').value;

    if (nombre && fecha) {
        productos.push({ nombre, fecha });
        localStorage.setItem('productos', JSON.stringify(productos));
        mostrarProductos();
        form.reset();
    } else {
        alert('⚠️ Por favor completa todos los campos.');
    }
});

// Borrar todos los productos
const botonBorrar = document.createElement('button');
botonBorrar.textContent = ' Borrar todo';
botonBorrar.style.cssText = `
    margin-top:10px;
    background-color:#e53935;
    color:white;
    border:none;
    padding:10px 15px;
    border-radius:8px;
    cursor:pointer;
    transition:0.3s;
`;
botonBorrar.addEventListener('mouseover', () => botonBorrar.style.backgroundColor = '#c62828');
botonBorrar.addEventListener('mouseout', () => botonBorrar.style.backgroundColor = '#e53935');
botonBorrar.addEventListener('click', () => {
    if (confirm('¿Seguro que querés borrar todos los productos?')) {
        productos = [];
        localStorage.removeItem('productos');
        mostrarProductos();
    }
});
document.querySelector('.lista').appendChild(botonBorrar);

// Contador de productos
menuContador.addEventListener('click', () => {
    totalProductosP.textContent = `Total de productos: ${productos.length}`;
    listaDiv.parentElement.style.display = 'none';
    contadorDiv.style.display = 'block';
});

// Volver a la lista
volverListaBtn.addEventListener('click', () => {
    mostrarProductos();
});

// Búsqueda en tiempo real
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const filtro = searchInput.value.toLowerCase();
        const filtrado = productos.filter(p => p.nombre.toLowerCase().includes(filtro));
        mostrarProductos(filtrado);
    });
}

// Botones de configuración, perfil y cerrar sesión
btnConfiguracion.addEventListener('click', () => alert('Aquí podrías abrir la sección de configuración.'));
btnPerfil.addEventListener('click', () => alert('Aquí podrías mostrar información del perfil.'));
btnCerrarSesion.addEventListener('click', () => {
    if (confirm('¿Seguro que querés cerrar sesión?')) {
        localStorage.clear();
        location.reload();
    }
});

// Mostrar productos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    mostrarProductos();
    verificarVencimientos();
});