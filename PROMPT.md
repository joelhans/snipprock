# Snipprok - React Code Snippet Stylizer - Multi-Phase Implementation

You are building a single-page React application called **Snipprok** that allows users to paste code blocks and stylize them with various options, using ngrok's Mantle UI library. The app should use Mantle's CodeBlock component and overall styling system.

**Important**: After each phase, verify that both `pnpm dev` and `pnpm build` work without errors before proceeding to the next phase. If you don't have the tools to complete certain tasks, create them.

**Documentation References:**
- Mantle Documentation: https://mantle.ngrok.com/
- Mantle Code Block Component: https://mantle.ngrok.com/components/code-block
- Mantle Setup Guide: https://mantle.ngrok.com/ (see "Setup" section)

---

## Phase 1: Project Setup & Basic Structure

**Objectives:**
- Initialize a new React project using Vite (`pnpm create vite` - choose React + JavaScript or TypeScript)
- Name the project "snipprok"
- Install Mantle UI library and required dependencies:
```bash
  pnpm add -E @ngrok/mantle @phosphor-icons/react date-fns react react-dom
```
- Install dev dependencies:
```bash
  pnpm add -DE tailwindcss @tailwindcss/vite
```
- Configure Vite to use the Tailwind plugin as shown in Mantle docs
- Import Mantle CSS (`@ngrok/mantle/mantle.css`) in your main file
- Set up the basic application shell with dark mode as default using Mantle's `ThemeProvider`
- Create a simple layout with a header showing "Snipprok" as the app name

**Deliverables:**
- Working React + Vite project named "snipprok"
- Mantle UI library properly integrated following their setup guide
- Basic dark mode interface using Mantle's theme system
- Header displaying "Snipprok"
- Dev server runs without errors
- Build process completes successfully

**Testing:**
- Run `pnpm dev` - verify the app loads with dark mode and shows "Snipprok" header
- Run `pnpm build` - verify build completes without errors

---

## Phase 2: Code Input & Display

**Objectives:**
- Create a textarea (using Mantle's `TextArea` component with `appearance="monospaced"`) for users to paste their code
- Implement Mantle's `CodeBlock` component to display the pasted code with syntax highlighting
- Use the CodeBlock composition API (`CodeBlock.Root`, `CodeBlock.Body`, `CodeBlock.Code`)
- Add language selection dropdown (using Mantle's `Select` component) to allow users to choose syntax highlighting language
- Ensure the code display updates reactively when users paste new code or change language

**Deliverables:**
- Functional code input area using Mantle TextArea
- Code display using Mantle's CodeBlock component with syntax highlighting
- Language selector for syntax highlighting
- Reactive updates between input and display

**Testing:**
- Run `pnpm dev` - paste code, change language, and verify it displays with correct syntax highlighting
- Run `pnpm build` - verify build completes without errors

---

## Phase 3: Stylization Controls

**Objectives:**
- Add UI controls (using Mantle components) for:
  - Font size adjustment (use Mantle's `Input` component with type="number")
  - Line numbers toggle (use Mantle's `Switch` component)
  - Background color picker (use native HTML color input styled with Mantle classes)
  - Border width control (use Mantle's `Input` or `Select`)
  - Padding adjustment (use Mantle's `Input` with type="number")
- Apply these settings to the CodeBlock display in real-time using inline styles or dynamic CSS
- Organize controls in a sidebar or panel using Mantle's layout components
- Use Mantle's `Label` component for all form controls

**Deliverables:**
- All stylization controls implemented using Mantle components
- Real-time preview of style changes on the CodeBlock
- Clean, organized control panel following Mantle design patterns

**Testing:**
- Run `pnpm dev` - verify all controls work and update the display in real-time
- Run `pnpm build` - verify build completes without errors

---

## Phase 4: PNG Export Functionality

**Objectives:**
- Install `html2canvas` library:
```bash
  pnpm add html2canvas
```
- Implement functionality to convert the styled CodeBlock to a PNG image
- Add a download button using Mantle's `Button` component
- Use html2canvas to capture the CodeBlock element
- Trigger browser download of the generated PNG with a meaningful filename (e.g., `snipprok-YYYY-MM-DD.png`)
- Ensure the captured image accurately reflects all applied styles (font size, colors, padding, borders)

**Deliverables:**
- Working "Download PNG" button using Mantle Button component
- Generated PNG accurately reflects the styled code snippet
- Clean, timestamped filename for downloaded images (using "snipprok" prefix)

**Testing:**
- Run `pnpm dev` - verify PNG downloads correctly with all applied styles
- Test with different style combinations
- Run `pnpm build` - verify build completes without errors

---

## Phase 5: Docker Containerization

**Objectives:**
- Create a Dockerfile that:
  - Uses a multi-stage build (build stage + nginx serve stage)
  - Installs pnpm in the build stage
  - Builds the React application (`pnpm build`)
  - Serves the built application using nginx
- Use node:alpine for the build stage and nginx:alpine as the final base image
- Copy the built files from `dist/` to nginx's HTML directory
- Expose port 80 in the container
- Create a `.dockerignore` file to exclude `node_modules`, `.git`, etc.
- Test the Docker build and run process

**Deliverables:**
- Working Dockerfile with multi-stage build using pnpm
- `.dockerignore` file
- Documentation on how to build and run the container
- Application accessible via http://localhost:8080 when running with port mapping

**Testing:**
- Run `docker build -t snipprok .` - verify build succeeds
- Run `docker run -p 8080:80 snipprok` - verify app is accessible at http://localhost:8080
- Verify all functionality works in the containerized version

---

## Phase 6: UX improvements

**Objectives:**
- Change the UI so that it's full-screen with the UI controls in a "panel" on
  the left-hand side
- Merge the input where the user adds their code with the Preview code block for
  a simpler UX overall
- Add UI controls (using Mantle components) for:
  - Width of the resulting code block (both by pixel, with a slider, and using
    the Padding value)
- Remove UI controls for:
  - Border width

**Deliverables:**
- All stylization controls implemented using Mantle components
- Real-time preview of style changes on the CodeBlock
- Clean, organized control panel following Mantle design patterns

**Testing:**
- Run `pnpm dev` - verify PNG downloads correctly with all applied styles
- Run `pnpm build` - verify build completes without errors
- Run `docker build -t snipprok .` - verify build succeeds
- Run `docker run -p 8080:80 snipprok` - verify app is accessible at http://localhost:8080
- Verify all functionality works in the containerized version

---

## Final Checklist

Before considering the project complete, verify:
- [ ] All phases completed successfully
- [ ] `pnpm dev` works without errors
- [ ] `pnpm build` works without errors
- [ ] Docker container builds successfully (using pnpm)
- [ ] Application runs in Docker container
- [ ] ngrok CLI can expose the application to public internet
- [ ] All Mantle UI components are properly styled in dark mode
- [ ] "Snipprok" branding is visible in the app header
- [ ] CodeBlock syntax highlighting works correctly
- [ ] PNG export captures all applied styles accurately (with "snipprok" filename prefix)
- [ ] All controls (font size, line numbers, colors, padding, borders) work properly
- [ ] Code is well-organized and commented
- [ ] README.md with complete setup and usage instructions exists
- [ ] README includes ngrok setup instructions
- [ ] Package.json shows "snipprok" as the project name

---

**Note**: Please complete each phase in order and confirm successful testing before moving to the next phase. If you encounter issues with any phase, pause and resolve them before proceeding.
