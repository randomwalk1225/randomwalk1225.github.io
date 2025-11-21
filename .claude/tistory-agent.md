# Tistory HTML Block Automation Rule

## Trigger Phrases
When the user says any of the following:
- "tistory에 넣기"
- "티스토리에 올리기"
- "tistory html 블록"
- "html 블록으로 만들어"
- Any similar phrase indicating conversion to Tistory HTML block format

## Automatic Actions

### 1. Identify Source
- Check if user specified a file from `/posts` folder
- If not specified, ask which post to convert

### 2. Convert to Tistory HTML Block Format
Create a self-contained HTML file in `/tistory` folder with:

**File Structure:**
```html
<script>
    MathJax = {
        tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']]
        }
    };
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

<style>
    .{topic-name}-content {
        max-width: 800px;
        margin: 0 auto;
        font-family: 'Noto Sans KR', sans-serif;
        line-height: 1.8;
        color: #333;
    }

    /* Include all necessary styles for:
       - Headers (h1, h2, h3)
       - Paragraphs and lists
       - Colored boxes (definition, theorem, example, problem, solution, note, warning)
       - Math displays
       - Code blocks if needed
    */
</style>

<div class="{topic-name}-content">
    <!-- Extract main content from blog post -->
    <!-- Include title, all sections, examples, problems -->
    <!-- Do NOT include: header navigation, footer, AdSense, Analytics -->
</div>
```

**Key Requirements:**
- **Wrapper class**: Use a unique class name based on the topic (e.g., `.taylor-content`, `.number-theory-content`)
- **MathJax**: Self-contained script loading at the top
- **Styles**: Complete inline styles within `<style>` tags
- **Content only**: Extract only the main content, excluding:
  - Navigation headers
  - Footer
  - Google AdSense
  - Google Analytics
  - Meta tags
  - External stylesheet links
- **Colored boxes**: Maintain the color-coded sections:
  - Definition (light blue): `#e3f2fd`
  - Theorem (light green): `#e8f5e9`
  - Example (light yellow): `#fff9c4`
  - Problem (light orange): `#ffe0b2`
  - Solution (light teal): `#e0f2f1`
  - Note (light purple): `#f3e5f5`
  - Warning (light red): `#ffebee`

### 3. Save Location
- Always save to `/tistory/{filename}.html`
- Use the same base filename as the source post
- Example: `posts/advanced-number-theory.html` → `tistory/advanced-number-theory.html`

### 4. Completion
- Confirm conversion is complete
- DO NOT automatically commit unless user requests
- Let user know the file is ready to copy-paste into Tistory

## Example Workflow

**User says:** "posts에 중국인의 나머지 정리를 tistory에 넣기"

**Agent action:**
1. Identify source: `posts/advanced-number-theory.html`
2. Read the source file
3. Extract main content (title, sections, examples, problems)
4. Create self-contained HTML with MathJax and styles
5. Use wrapper class: `.number-theory-content`
6. Save to: `tistory/advanced-number-theory.html`
7. Confirm completion: "티스토리 HTML 블록이 `tistory/advanced-number-theory.html`에 생성되었습니다."

## Technical Notes

- **MathJax syntax**: Keep inline math `$...$` and display math `$$...$$`
- **Korean content**: Ensure UTF-8 encoding
- **Responsive**: Styles should work on mobile devices
- **Copy-paste ready**: User should be able to directly paste into Tistory HTML block editor
- **No external dependencies**: Everything must be self-contained except MathJax CDN

## Maintenance

- Update this file if conversion patterns change
- Add new trigger phrases as they emerge
- Document any special cases or exceptions
