let publicBase = "/";

export function configurePublicPath(base: string) {
    publicBase = base.endsWith("/") ? base : `${base}/`;
}

export function publicPath(path: string) {
    if (!path.startsWith("/") || path.startsWith("//") || (publicBase !== "/" && path.startsWith(publicBase))) return path;
    return `${publicBase}${path.slice(1)}`;
}
