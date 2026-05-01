// Cambiar texto bienvenida
function cambiarBienvenida() {
    parrafo = document.getElementById("parrafo1");
    parrafo.innerHTML = "≽^-˕-^≼";
}

// Cambio de tema
function cambioTema() {
  const botonTema = document.getElementById('theme-toggle');
  const cuerpo = document.body;

  // Verificamos que el botón exista antes de agregar el evento
  if (botonTema) {
    botonTema.addEventListener('click', () => {
      cuerpo.classList.toggle('blue-theme');

      // Cambio de icono simple
      if (cuerpo.classList.contains('blue-theme')) {
        botonTema.textContent = '⏾';
      } else {
        botonTema.textContent = '✷';
      }
    });
  }
}

// Ejecutar la función cuando cargue el documento
document.addEventListener('DOMContentLoaded', cambioTema);

// Cambiar fotos del staff
function cambiarFotosStaff() {
  const nuevaFoto1 = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTeUrvqOBjMOKCZ_ZhWxJRLc7g5Gclv7Lnm8g&s";
  const nuevaFoto2 = "https://i.pinimg.com/736x/90/b2/6a/90b26ac18df70f2e8eaa45627fb4aa47.jpg";
  const nuevaFoto3 = "https://i.pinimg.com/236x/51/30/77/5130770e4cdec78276415c649837bef0.jpg";
  const nuevaFoto4 = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEPq90TfdskaD7PbLP11OR3qK8BJGz4wgxMg&s";

  const imgGato1 = document.getElementById("gato1");
  const imgGato2 = document.getElementById("gato2");
  const imgGato3 = document.getElementById("gato3");
  const imgGato4 = document.getElementById("gato4");

  if (imgGato1 && imgGato2 && imgGato3 && imgGato4) {
    imgGato1.src = nuevaFoto1;
    imgGato2.src = nuevaFoto2;
    imgGato3.src = nuevaFoto3;
    imgGato4.src = nuevaFoto4;
  }
}