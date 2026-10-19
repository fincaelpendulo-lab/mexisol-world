// One-off: replace canvas placeholder photos with better shots from the drive.
// Resizes to at most 2400px on the long side and strips all metadata.
import sharp from 'sharp';
const M = '/Volumes/FINCA EL PENDULO/Selección de fotos y videos/Mejores Fotos - Web y Redes';
const H = '/Volumes/FINCA EL PENDULO/Selección de fotos/Hospedaje';
const swaps = {
  'lake-avalon-with-its-palapa-and': `${M}/02 Espacios/02-033_palapa-junto-laguna.jpg`,
  'guests-sitting-and-swimming-at-lake': `${M}/04 Bienestar y actividades/04-093_circulo-de-mujeres.jpg`,
  'guests-painting-and-working-with-clay': `${M}/04 Bienestar y actividades/04-096_taller-creativo.jpg`,
  'guests-setting-out-on-a-horseback': `${M}/06 Caballos y animales/06-113_cabalgata-grupo.jpg`,
  'rider-on-a-chestnut-horse-looking': `${M}/06 Caballos y animales/06-117_jinete-sonriente.jpg`,
  'pool-in-front-of-the-brick': `${M}/02 Espacios/02-032_alberca-larga.jpg`,
  'inside-the-gaia-greenhouse-full-of': `${M}/02 Espacios/02-014_invernadero-mesa.jpg`,
  'hormiguero-a-palm-roofed-building-among': `${M}/02 Espacios/02-023_palapa-hormiguero.jpg`,
  'guests-sharing-a-candlelit-dinner-at': `${M}/05 Comida y celebraciones/05-076_cena-mesa-larga.jpg`,
  'guests-gathered-inside-the-osho-hut': `${M}/04 Bienestar y actividades/04-095_ritual-cacao.jpg`,
  'onyx-pillars-of-the-oracle-glowing': `${M}/04 Bienestar y actividades/04-084_yoga-circulo.jpg`,
  'wooden-patio-with-tile-roofs-and': `${M}/02 Espacios/02-012_patio-madera.jpg`,
  'maguey-a-green-room-with-a': `${H}/Habitaciones sencillas/Maguey/Frontal de Maguey.JPG`,
  'tilopa-a-deep-blue-room-with': `${M}/03 Hospedaje/03-055_tilopa.jpg`,
  'jumanji-a-green-room-with-a': `${M}/03 Hospedaje/03-054_jumanji.jpg`,
  'lobo-bedroom-with-a-yellow-woven': `${M}/03 Hospedaje/03-063_lobo.jpg`,
  'loba-bedroom-with-a-wagon-wheel': `${H}/Habitaciones sencillas/Loba/IMG_6010.JPG`,
  'cactus-bedroom-with-a-sitting-area': `${H}/Habitaciones sencillas/Cactus/Habitación Cactus.JPG`,
  'corner-jacuzzi-in-the-tilopa-bathroom': `${H}/Habitaciones plus/Tilopa/Baño de Tilopa.JPG`,
  'agave-bedroom-with-woven-baskets-on': `${M}/03 Hospedaje/03-057_agave-cama.jpg`,
  'oeste-bedroom-with-two-single-beds': `${M}/03 Hospedaje/03-064_oeste.jpg`,
};
for (const [slug, src] of Object.entries(swaps)) {
  const out = `src/assets/photos/${slug}.jpg`;
  const info = await sharp(src).rotate().resize(2400, 2400, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
  console.log(`${info.width}x${info.height}`.padEnd(10), slug);
}
