"""Next static export -> страница для превью-хостинга: относительные пути, без <html>/<head>/<body>."""
import pathlib, re, shutil, sys

src = pathlib.Path(sys.argv[1])   # out/
dst = pathlib.Path(sys.argv[2])   # site/
if dst.exists():
    shutil.rmtree(dst)
shutil.copytree(src / "_next", dst / "assets")

for f in (dst / "assets").rglob("*"):
    if f.suffix == ".js":
        t = f.read_text()
        t = t.replace('r.p="/_next/"', 'r.p="./assets/"')
        t = t.replace("\ufffd", "\\ufffd")  # хостинг не принимает сырой U+FFFD
        f.write_text(t)
    elif f.suffix == ".css":
        f.write_text(f.read_text().replace("/_next/static/media/", "../media/"))

html = (src / "index.html").read_text()
html = html.replace('"/_next/', '"./_next/').replace("\\\"/_next/", "\\\"./_next/")
html = html.replace("./_next/", "./assets/")
m_html = re.search(r"<html([^>]*)>", html)
cls = re.search(r'class="([^"]*)"', m_html.group(1)).group(1)
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body[^>]*>(.*)</body>", html, re.S).group(1)
head = re.sub(r'<meta charSet="utf-8"/>|<meta name="viewport"[^>]*/>', "", head)
boot = f'<script>document.documentElement.lang="ru";document.documentElement.className+=" {cls}";</script>'
(dst / "index.html").write_text("<title>Foundation</title>" + boot + head + body)
print("ok", sum(1 for _ in dst.rglob("*") if _.is_file()), "files")
