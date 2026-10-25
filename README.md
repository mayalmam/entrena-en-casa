# Mi entreno en casa

App estática basada en Mi entreno / Pista eléctrica. Diez sesiones de 60 minutos: cinco globales, dos de tren superior, dos de tren inferior y una de core y estabilidad. Peso corporal y bandas opcionales. No requiere pesas ni máquinas.

## Uso
Abrir index.html mediante un servidor estático. En GitHub Pages seleccionar la rama main y la carpeta raíz. Sin instalación ni dependencias externas.

Cada sesión: 10 min de calentamiento + 24 min de fuerza + 16 min de intervalos tipo tabata (A/B/A/B) + 5 min de movimiento suave + 5 min de vuelta a la calma. Son tiempos orientativos: adapta pausas y duración a tus sensaciones. No es necesario hacer todas las sesiones cada semana; alterna días y evita repetir el mismo grupo muscular en días consecutivos.

El temporizador reutiliza trabajo/descanso/rondas, pantalla completa y opciones de sonido. Los presets no arrancan automáticamente. No cuenta el último descanso: completa 10 s por bloque tabata y 60 s en fuerza para mantener los tiempos previstos. Se pausa al cerrar; cambiar de preset reinicia el bloque.

Favoritos, notas, registros fechados y progreso CSV/PDF se guardan exclusivamente en el navegador. Las claves casa-* aíslan estos datos de la app del gimnasio alojada en el mismo dominio. Borrar los datos del navegador elimina el historial; exporta periódicamente.

El informe PDF se obtiene desde Imprimir / Guardar PDF del navegador. CSV compatible con Excel. Sin cuentas, servidor o sincronización.

## Comprobaciones
node --test tests/*.test.cjs
