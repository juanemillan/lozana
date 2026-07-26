# Estrategia de IA para Lozana

> Decisión revisada el 26 de julio de 2026. Los modelos y precios cambian con frecuencia:
> verificar las páginas oficiales antes de lanzar una función de pago.

## Decisión

Usar **OpenAI como proveedor principal**, mediante Responses API, y mantener una interfaz interna
que evite acoplar el dominio de Lozana al SDK.

La elección no se debe a una diferencia concluyente en extracción: OpenAI y Claude admiten
visión, herramientas y salidas estructuradas. OpenAI encaja mejor con el roadmap completo porque
también ofrece generación y edición de imágenes con GPT Image 2. Claude puede analizar imágenes,
pero sus modelos conversacionales no generan una imagen como salida.

No integrar dos proveedores al principio. Añadir Claude solo si pruebas reales muestran una
ventaja importante en calidad, costo o cobertura de páginas.

## Comparación de precios de texto

Precios estándar en USD por un millón de tokens:

| Nivel | Modelo | Entrada | Entrada en caché | Salida |
|---|---|---:|---:|---:|
| Económico | OpenAI GPT-5.6 Luna | $1.00 | $0.10 | $6.00 |
| Económico | Claude Haiku 4.5 | $1.00 | $0.10 | $5.00 |
| Intermedio | OpenAI GPT-5.6 Terra | $2.50 | $0.25 | $15.00 |
| Intermedio | Claude Sonnet 4.6 | $3.00 | $0.30 | $15.00 |
| Máxima capacidad | OpenAI GPT-5.6 Sol | $5.00 | $0.50 | $30.00 |
| Máxima capacidad | Claude Opus 4.7 | $5.00 | $0.50 | $25.00 |

Claude Sonnet 5 tiene un precio introductorio de **$2 entrada / $10 salida** hasta el
31 de agosto de 2026; después pasa a **$3 / $15**.

Fuentes: [modelos y precios de OpenAI](https://developers.openai.com/api/docs/models),
[comparador GPT-5.6](https://developers.openai.com/api/docs/models/compare) y
[precios de Claude](https://platform.claude.com/docs/en/about-claude/pricing).

### Ejemplo orientativo por producto

Supuesto: una página limpia consume 2.500 tokens de entrada y la ficha estructurada devuelve
500 tokens. No incluye herramientas, reintentos ni imágenes.

| Modelo | Costo aproximado por ficha |
|---|---:|
| GPT-5.6 Luna | $0.0055 |
| Claude Haiku 4.5 | $0.0050 |
| GPT-5.6 Terra | $0.0138 |
| Claude Sonnet 4.6 | $0.0150 |

Una ficha económica rondaría medio centavo de dólar; mil fichas similares rondarían entre
$5 y $6. Estas cifras no predicen la calidad y deben validarse con un conjunto real de tiendas.

El factor de costo más importante es el tamaño de la página. La documentación de Claude estima
unas 2.500 tokens para una página promedio de 10 KB y 25.000 para una página grande de 100 KB.
Por eso Lozana debe extraer y limpiar metadatos, JSON-LD y texto relevante antes de invocar al
modelo, además de imponer límites estrictos.

## Costos de herramientas e imágenes

- Claude Web Fetch no añade una tarifa por llamada, pero el contenido recuperado se cobra como
  tokens. No admite páginas renderizadas dinámicamente con JavaScript.
- Claude Web Search cuesta $10 por 1.000 búsquedas, además de tokens.
- Las herramientas alojadas de OpenAI pueden tener cargos por llamada; verificar el precio
  vigente cuando se implemente cada una.
- GPT Image 2 se cobra por separado del modelo de texto. Usarlo para ilustraciones, edición y
  recursos visuales; consultar el calculador vigente antes de habilitar generación para usuarios.

Fuentes: [Claude Web Fetch](https://platform.claude.com/docs/es/agents-and-tools/tool-use/web-fetch-tool),
[Claude Web Search](https://platform.claude.com/docs/es/agents-and-tools/tool-use/web-search-tool) y
[GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2).

## Enrutamiento recomendado

| Función | Modelo inicial | Motivo |
|---|---|---|
| Normalizar marca, línea y alias | GPT-5.6 Luna | Tarea breve, frecuente y estructurada |
| Prellenar desde una página limpia | GPT-5.6 Luna | Empezar barato y escalar solo si falla |
| Página ambigua o etiqueta fotografiada | GPT-5.6 Terra | Mejor equilibrio entre visión y razonamiento |
| Análisis de rutina | GPT-5.6 Terra | Requiere juicio y contexto del perfil |
| Casos complejos excepcionales | GPT-5.6 Sol | Solo tras detectar baja confianza |
| Generar o editar imágenes | GPT Image 2 | Modelo visual especializado |

Los iconos de interfaz deben seguir siendo SVG diseñados dentro del sistema visual. La generación
de imágenes es más útil para ilustraciones, fondos, composiciones editoriales o edición de fotos.

## Arquitectura

La aplicación controla la descarga de URLs y entrega al modelo contenido limpio. No se delega
la seguridad de red al proveedor.

```text
URL del usuario
  → validación SSRF, timeout y límite de tamaño
  → extracción de JSON-LD, Open Graph y texto útil
  → modelo de texto con JSON Schema
  → vista previa con fuente y confianza
  → confirmación del usuario
  → catálogo en borrador + producto personal
```

Crear un contrato interno como `AIProvider.extractProduct()` y `AIProvider.analyzeLabel()`.
Las capas de catálogo y formulario consumen ese contrato, nunca directamente el SDK de OpenAI.

## Control de gasto

- Presupuesto máximo de tokens y timeout por operación.
- Luna por defecto; Terra o Sol solo por baja confianza o acción explícita.
- Ningún reintento infinito: como máximo uno con un modelo superior.
- Guardar el resultado confirmado y reutilizarlo; no volver a analizar la misma fuente sin motivo.
- Registrar modelo, tokens, costo estimado, latencia y resultado aceptado/corregido.
- Mostrar confirmación antes de cualquier generación de imagen que tenga costo visible.
- Establecer límites diarios por usuario antes de habilitar registro público.

## Próxima validación

Construir un conjunto de 20–30 URLs reales de tiendas usadas por Lozana. Medir:

1. Exactitud de marca, línea, nombre, tamaño, precio y moneda.
2. Porcentaje de páginas bloqueadas o dinámicas.
3. Correcciones realizadas por el usuario.
4. Tokens, costo y latencia por ficha.
5. Diferencia real entre Luna y Terra.

Elegir modelos por estos resultados, no por una comparación general de benchmarks.
