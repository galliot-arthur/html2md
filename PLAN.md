# html2md — Convertisseur HTML vers Markdown

## Résumé

Script CLI en TypeScript qui convertit un fichier HTML (sauvegardé depuis un navigateur) en fichier Markdown propre. Le script extrait le contenu principal de la page, ignore le bruit (navigation, pubs, scripts, styles), et produit un Markdown lisible.

## Stack technique

- **Langage** : TypeScript (Node.js)
- **Gestion de projet** : pnpm
- **Parsing HTML** : `linkedom` (DOM léger, sans dépendance native)
- **Conversion HTML → MD** : `turndown` (référence pour la conversion HTML→Markdown)
- **Tests** : `vitest`
- **Linting** : `eslint` + `@typescript-eslint`
- **Build** : `tsx` (exécution directe de TypeScript)
- **Versioning** : git

## Étapes de conception

### 1. Initialisation du projet
- `git init`
- `npm init`
- Installer les dépendances : `typescript`, `tsx`, `turndown`, `linkedom`
- Installer les dépendances de dev : `vitest`, `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`
- Configurer `tsconfig.json`, `eslint.config.mjs`, `.gitignore`

### 2. Module de conversion (`src/convert.ts`)
- Fonction `htmlToMarkdown(html: string): string`
- Charger le HTML avec `linkedom`
- Extraire le contenu principal (`<article>`, `<main>`, ou `<body>`)
- Nettoyer les éléments parasites (`<script>`, `<style>`, `<nav>`, `<header>`, `<footer>`, `<aside>`)
- Convertir en Markdown via `turndown`

### 3. CLI (`src/cli.ts`)
- Lire le chemin du fichier HTML en argument
- Lire le fichier, appeler `htmlToMarkdown`
- Écrire le résultat dans un fichier `.md` (même nom, extension changée) ou sur stdout

### 4. Tests (`tests/convert.test.ts`)
- Test de conversion basique (paragraphes, titres, liens, images, listes, listes imbriquées, tables, table avec éléments imbriqués)
- Test de nettoyage des éléments parasites
- Test avec un fichier HTML réel sauvegardé depuis un navigateur

### 5. Linting et qualité
- Configurer ESLint pour TypeScript
- Script npm `lint` pour vérifier le code
- Script npm `test` pour lancer les tests
- Script npm `build` pour vérifier la compilation TypeScript

### 6. Finalisation
- Vérifier que `npm run lint`, `npm test` et `npm run build` passent
- Commit initial avec tout le code
