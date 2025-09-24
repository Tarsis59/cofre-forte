export const CATEGORY_COLORS: { [key: string]: string } = {
  Streaming: "#00C49F", // Verde
  Trabalho: "#0088FE", // Azul
  "Bem-estar": "#FFBB28", // Amarelo
  Jogos: "#FF8042", // Laranja
  Outro: "#A9A9A9", // Cinza
};

export const getColorForCategory = (category: string) => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS["Outro"];
};
