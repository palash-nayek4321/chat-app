const colors = [
  //   "#c0392b" /*red*/,
  //   "#e74c3c" /*red*/,
  //   "#9b59b6" /*purple*/,
  //   "#8e44ad" /*purple*/,
  //   "#2980b9" /*blue*/,
  //   "#3498db" /*blue*/,
  //   "#1abc9c" /*green*/,
  //   "#16a085" /*green*/,
  //   "#27ae60" /*green*/,
  //   "#2ecc71" /*green*/,
  //   "#f1c40f" /*yellow*/,
  //   "#f39c12" /*yellow*/,
  //   "#e67e22" /*orange*/,
  //   "#d35400" /*orange*/,
  //   //   "#34495e", /**/
  //   //   "#2c3e50", /**/
  "#7f66ff" /*purple*/,
  "#06cf9c" /*green-turkuaz*/,
  "#53a6fd" /*blue*/,
  "#ff72a1" /*pink*/,
  "#fa6533" /*orange*/,
  "#ffd279" /*yellow*/,
  "#a5b337" /*green*/,
  "#f15c6d" /*red*/,
  "#d88deb" /*lila*/,
  "#fc9775" /*light-orange*/,
];

export const getColor = () => {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return randomColor;
};
