# Entrenamiento guiado · revisión UX

Versión para pruebas, 25 octubre 2026. Conserva la identidad existente. El recorrido funciona en la misma app: elegir → entrenar → registrar → finalizar → historial.

## Estados y comportamientos

- Tarjeta: objetivo, 60 minutos, material, ejercicios principales y suelo opcional. Realizadas con texto y fecha del último registro; marcas antiguas sin fecha inventada. Repetir conserva entradas anteriores.
- Entrenamiento: comienza pausado. Continuar inicia el reloj; Pausar conserva el tiempo. Cerrar pausa. Consultar ficha conserva el punto de la sesión mientras la página esté abierta. Recargar pierde el punto del reloj, pero conserva borradores e historial.
- Ejercicio: nombre, esquema orientativo, instrucciones, alternativa sencilla, dosis, vuelta, tiempo del paso y siguiente ejercicio. Descanso/cambio identificado mediante texto. Avanzar acorta el tiempo previsto y deja el siguiente paso pausado.
- Secuencia compartida: 10 minutos calentamiento/ensayo; fuerza 3 vueltas de 4 ejercicios, 60 segundos de ejercicio y 60 de descanso, incluidos los 12 descansos (24 minutos); circuito A/B/A/B con 8 intervalos 20+10 por bloque (16 minutos); 5 minutos movimiento suave; 5 vuelta a la calma. Total 60 minutos.
- Borrador: registros y notas automáticos en el navegador. No equivale a entrenamiento finalizado.
- Cierre: una acción crea una instantánea fechada de sesión, registros y notas. Confirmación solo tras escribir correctamente el historial. El doble guardado del mismo recorrido no duplica la entrada. Las repeticiones generan nuevas entradas. Si se termina antes se indica en historial.
- Historial: consulta de entradas independientes. Exportación mensual incluye registros nuevos y registros anteriores del sistema de progreso. Almacenamiento local, sin sincronización entre dispositivos.
- Error de almacenamiento: mensaje explícito, sin confirmar éxito ni añadir una entrada en memoria.

## Comprobaciones realizadas

Validación de sintaxis de todos los scripts; 10 planes con duración total y duración por bloque verificadas. Pruebas DOM del recorrido guiado, ficha, cierre, repetición sin sobrescritura, historial/exportación y fallo de almacenamiento.

## Pendiente antes de cerrar

La ejecución de navegador visual no estuvo disponible en el entorno: faltan inspección visual móvil/escritorio, zoom 200/400 %, lector de pantalla, contraste medido, foco en transiciones, botones y teclado en dispositivos reales. Las reglas adaptables y de foco están implementadas, pero no equivalen a una auditoría aprobada. Revisar también las ilustraciones orientativas con una profesional de actividad física.

Prueba con unas cinco usuarias del público previsto, con diferentes niveles digitales: elegir una sesión sin suelo, comenzar, identificar ejercicio/vuelta/siguiente, pausar/continuar, consultar ayuda, anotar una resistencia, terminar, encontrar el registro y repetir sin perderlo. Registrar errores, dudas, necesidad de ayuda y si distingue borrador de sesión guardada. No se ha realizado esta prueba ni se da el diseño por validado.
