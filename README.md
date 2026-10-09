# QuickPage
A simple client-side HTML template preprocessor (static site generator) for VS code.

## Project structure example
- 📁 _quickpage
    - 📄 config.json
- 📁 quickpage-output
    - 📁 css
        - 📄 main.css
    - 📁 images
        - 📄 test.png
    - 📄 *index.html* **(auto-generated)**
- 📁 src
    - 📁 layouts
        - 📄 _main_layout.html
    - 📄 index.html
> [!NOTE]
> Add an underscore to the beginning of a file name to not include it in the output directory, e.g. *_file.html*.

> [!NOTE]
> You can store static content directly in the output folder.

## Default configuration file
_quickapge/config.json
```json
{
   "$schema": "schema.json",
   "relWorkDir": "src",
   "relOutputDir": "quickpage-output",
   "formatterOptions": {
      "parser": "html",
      "bracketSameLine": true,
      "bracketSpacing": false,
      "printWidth": 700,
      "useTabs": true
   }
}
```

## Usage
### 1. Include HTML, CSS and JavaScript 
```html
<include myattr="1">path_to_file.html</include> <!-- attributes are optional and passed to the included file -->
<include>style.css</include> <!-- will be included as <style> ... </style> -->
<include>script.js</include> <!-- will be included as <script> ... </script> -->
```
### 2. Use another page as a parent
child.html:
```html
<parent>parent.html</parent> <!-- attributes are optional and passed to the parent file -->
```
parent.html:
```html
<content><!-- here will be the child page's content --></content>
```
### 3. Pass attributes
child.html:
```html
<parent var="12" var2="20">parent.html</parent>
```
parent.html:
```html
<content></content>
<span><attr>var</attr></span> <!-- will be rendered as <span>12</span> -->
<span><attr>var2</attr></span> <!-- will be rendered as <span>20</span> -->
```
*Also, inline style may be used:*
```html
<span attr>@@var</span>
<span attr>@@var2</span>
<input attr type="text" value="@@var3"> 
```

### 4. Require tag
```html
<!-- The following tag and its content will be removed if no "var" attribute is passed -->
<require name="var">
    <p>Lorem ipsum</p>
</require>
<!-- Also, value checking is possible -->
<require name="var" value="empty">
    <p attr>var equals @@var</p>
</require>
```
>[!WARNING]
> Do not place require tags in the head section. Use the **headdata** tag instead.

### 5. Headdata tag
**```<hd>``` is placed inside HTML body. Its content is always moved to the head section of the document.**

### 6. JavaScript code execution
Raw file:
```html
<p>
    2 + 2 =
    <script exec>
        let attributes = this.attrs; // access attributes
        let document = this.document; // access DOM
        this.sum = 2 + 2;
        // write "null;" at the end of the script if you do not want to display returned value
    </script>
</p>
```
Processed file:
```html
<p>2 + 2 = 4</p>
```

Execute an external file at compile time:
```html
<p>
    <script dependency="script.js" exec>
        "executed 'script.js'!";
    </script>
</p>
```

<!-- ## Parameters

| Name  | Description |
| ------------- | ------------- |
| -path [string] | Working directory  |
| -output [string] | Output directory  |
| -minify  | Removes new lines and tabulation from the output files  | -->
