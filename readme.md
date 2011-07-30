Pelpa page builder
=========

Pelpa is a lightweight generator of simple, single-page, static content sites.
eg: Books, Thesis, Portfolios

Key Features
------------
  - Simple! 
   - single-page, markdown-based, no developers or designers skills needed, just write content
  - Free!
   - open-source, free for any use, free to change and improve
   - based on very few and popular open-sourced libs (markdown, jQuery)
   - content has no dependencies on any tool, technology or service, you OWN your content
  - Publish anywhere
   - github pages
   - static HTTP servers (using FTP, SSH, or WebDAV)
   - file-based (DVDs, pendrives, emails)
  - View anywhere
   - generated pages works in any browser, any device
   - Accesibility
   - SEO

How to use
----------
### Edit content text, Markdown
Text content must be in markdown format, markdown can be wrote in any plain-text app (eg: notepad on Windows, vi on Linux, TextMate on Mac)
Markdown supports titles and subtitles (document hierarchy), text weight or decorations (bold, underline, italic), hyperlinks, and other structures using special characthers. 

For a tutorial on Markdown you can try the [Showdown page](http://softwaremaniacs.org/playground/showdown-highlight/)

### Files
You can add images, video, audio or other file resources under the /files folder, then reference this files in markdown this way:

  Download [this picture](files/picture.jpg)

### Build
When you are ready to generate your page, run build.bat (or build.js using NodeJS), this will take your markdown content and build an index.htm file with all your page content.
Layout and style will be added on this step.  

### Publish 
At the moment Pelpa doesn't support any publishing mechanism, you can upload your entire site folder to any static web server (eg. github pages).

How to improve Pelpa
------------------
Fork me on Github! Pelpa source is at http://github.com/benjamine/pelpa
