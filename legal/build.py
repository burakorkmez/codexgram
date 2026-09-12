"""Build the static review copy from the canonical Markdown, with no dependencies."""
from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parent


def inline(value):
    value = html.escape(value)
    value = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", value)
    # The canonical legal documents use bracketed placeholders, not Markdown links.
    return re.sub(r"\[([^\]]+)\]", r'<mark class="placeholder">[\1]</mark>', value)


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def build(source="TERMS-OF-SERVICE.md", output="terms.html"):
    privacy = output == "privacy.html"
    blocks = (ROOT / source).read_text().strip().split("\n\n")
    content, navigation = [], []
    for block in blocks:
        if block.startswith("# "):
            continue
        if block.startswith("## "):
            title = block[3:].strip()
            anchor = slug(title)
            content.append(f'<h2 id="{anchor}">{inline(title)}</h2>')
            navigation.append(f'<a href="#{anchor}">{html.escape(title)}</a>')
        elif block.startswith("- "):
            content.append("<ul>" + "".join(f"<li>{inline(line[2:])}</li>" for line in block.splitlines()) + "</ul>")
        else:
            content.append("<p>" + "<br>".join(inline(line.rstrip()) for line in block.splitlines()) + "</p>")

    page = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><meta name="description" content="Codexgram Terms of Service: a testing draft for review, with unconfirmed legal fields clearly marked.">
<meta name="theme-color" content="#087eff"><title>Terms of Service — Codexgram testing draft</title>
<link rel="icon" href="assets/logo.png"><link rel="stylesheet" href="styles.css"><script src="site.js" defer></script></head>
<body><a class="skip-link" href="#terms-content">Skip to terms</a>
<header class="site-header wrap"><a class="brand" href="index.html"><img src="assets/logo.png" width="36" height="36" alt=""><span>Codexgram.</span></a><nav aria-label="Main navigation"><a class="nav-cta" href="index.html">Back to the preview ↗</a></nav></header>
<main><div class="legal-header wrap"><p class="eyebrow">THE CODEXGRAM TESTING RELEASE</p><h1>Terms of Service<span class="brand-dot">.</span></h1>
<p>A clear account of how the app works, and what using it means. This is a review draft. Highlighted fields are unconfirmed.</p>
<div class="legal-tools"><a class="button" href="TERMS-OF-SERVICE.md" download>Download Markdown ↓</a><button class="button" type="button" data-print>Print / save PDF ↗</button></div></div>
<div class="legal-layout wrap"><aside class="legal-nav"><p>IN THIS DOCUMENT</p><nav aria-label="Terms sections" style="display:block">NAVIGATION</nav></aside>
<article id="terms-content" class="legal-prose">CONTENT</article></div></main>
<footer class="site-footer wrap"><a class="brand" href="index.html"><span>Codexgram.</span></a><p>Testing draft · Qualified attorney review required before publication.</p><a href="index.html">Back to Codexgram ↗</a></footer></body></html>
'''
    page = page.replace("NAVIGATION", "\n".join(navigation)).replace("CONTENT", "\n".join(content))
    if privacy:
        page = page.replace("Terms of Service", "Privacy Policy").replace("terms-content", "privacy-content").replace("Skip to terms", "Skip to policy").replace("Terms sections", "Privacy sections").replace("TERMS-OF-SERVICE.md", source)
        page = page.replace("A clear account of how the app works, and what using it means.", "How the testing app handles accounts, content, messages and deletion.")
    other = '<a href="terms.html">Terms of Service</a>' if privacy else '<a href="privacy.html">Privacy Policy</a>'
    page = page.replace('<a class="nav-cta" href="index.html">', other + '<a class="nav-cta" href="index.html">')
    (ROOT / output).write_text(page)
    print(f"Generated {output}: {len(navigation)} sections from {source}")


if __name__ == "__main__":
    build()
    build("PRIVACY-POLICY.md", "privacy.html")
