export async function fetchAnilistMetadata(mangaTitle: string) {
  // LIMPIEZA: Quitamos cosas como (2023), [Digital], _, etc.
  const cleanTitle = mangaTitle
    .replace(/\(.*\)/g, "") // Quita paréntesis
    .replace(/\[.*\]/g, "") // Quita corchetes
    .replace(/[_-]/g, " ")  // Cambia guiones por espacios
    .trim();

  const query = `
    query ($search: String) {
      Media (search: $search, type: MANGA) {
        id
        title { romaji english native }
        description(asHtml: false)
        status
        genres
        bannerImage
        coverImage { extraLarge large }
      }
    }
  `;

  try {
    console.log(`📡 Llamando a AniList para: "${cleanTitle}"...`);
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { search: cleanTitle } })
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error("❌ Error de AniList:", result.errors[0].message);
      return null;
    }

    return result.data?.Media || null;
  } catch (e) {
    console.error("❌ Error de red con AniList");
    return null;
  }
}