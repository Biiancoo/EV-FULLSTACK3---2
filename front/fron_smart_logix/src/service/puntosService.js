export const calcularPuntosGanados = (valorTotal, porcentajeBono) => {
  let porcentajeAplicado = porcentajeBono;
  
  if (porcentajeAplicado < 5) porcentajeAplicado = 5;
  if (porcentajeAplicado > 10) porcentajeAplicado = 10;

  const puntos = valorTotal * (porcentajeAplicado / 100);
  return Number(puntos.toFixed(2));
};