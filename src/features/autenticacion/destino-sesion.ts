export function destinoSesion(rol: unknown) {
  switch (rol) {
    case "SUPER_ADMIN":
      return "/superadmin";
    case "ADMIN_DESTINO":
      return "/administracion";
    case "TURISTA":
      return "/destinos";
    default:
      return null;
  }
}
