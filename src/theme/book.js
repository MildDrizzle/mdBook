var html, sidebar, sidebarLinks, sidebarToggleButton, themeToggleButton, themePopup;

document.addEventListener('DOMContentLoaded', function() {

    // url
    var url = window.location.pathname;

    // Fix back button cache problem
    window.onunload = function(){};

    // Set theme
    var theme = store.get('mdbook-theme');
    if (theme === null || theme === undefined) { theme = 'light'; }

    set_theme(theme);

    // Syntax highlighting Configuration
    hljs.configure({
        tabReplace: '    ', // 4 spaces
        languages: [],      // Languages used for auto-detection
    });

    if (window.ace) {
        // language-rust class needs to be removed for editable
        // blocks or highlightjs will capture events
        Array
            .from(document.querySelectorAll('code.editable'))
            .forEach(function(block) { block.classList.remove('language-rust'); });

        Array
            .from(document.querySelectorAll('code:not(.editable)'))
            .forEach(function(block) { hljs.highlightBlock(block); });
    } else {
        Array
            .from(document.querySelectorAll('code'))
            .forEach(function(block) { hljs.highlightBlock(block); });
    }

    // Adding the hljs class gives code blocks the color css
    // even if highlighting doesn't apply
    Array
        .from(document.querySelectorAll('code'))
        .forEach(function(block) { block.classList.add('hljs'); });

    var KEY_CODES = {
        PREVIOUS_KEY: 37,
        NEXT_KEY: 39,
        ESCAPE_KEY: 27,
    };

    document.addEventListener('keydown', function (e) {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) { return; }
        switch (e.keyCode) {
            case KEY_CODES.NEXT_KEY:
                e.preventDefault();
                var nextButton = document.querySelector('.nav-chapters.next');
                if(nextButton) {
                    window.location.href = nextButton.href;
                }
                break;
            case KEY_CODES.PREVIOUS_KEY:
                e.preventDefault();
                var previousButton = document.querySelector('.nav-chapters.previous');
                if(previousButton) {
                    window.location.href = previousButton.href;
                }
                break;
            case KEY_CODES.ESCAPE_KEY:
                e.preventDefault();
                hideThemes();
                break;
        }
    });

    // Interesting DOM Elements
    html = document.querySelector('html');
    sidebar = document.getElementById("sidebar");
    sidebarLinks = document.querySelectorAll('#sidebar a');
    sidebarToggleButton = document.getElementById("sidebar-toggle");
    themeToggleButton = document.getElementById('theme-toggle');
    themePopup = document.getElementById('theme-list');

    // Toggle sidebar
    sidebarToggleButton.addEventListener('click', sidebarToggle);

    // Scroll sidebar to current active section
    var activeSection = sidebar.querySelector(".active");
    if(activeSection) {
        sidebar.scrollTop = activeSection.offsetTop;
    }

    var firstContact = null;

    document.addEventListener('touchstart', function(e) {
        firstContact = {
            x: e.touches[0].clientX,
            time: Date.now()
        };
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!firstContact) 
            return;

        var curX = e.touches[0].clientX;
        var xDiff = curX - firstContact.x,
            tDiff = Date.now() - firstContact.time;

        if (tDiff < 250 && Math.abs(xDiff) >= 150) {
            if (xDiff >= 0 && firstContact.x < Math.min(document.body.clientWidth * 0.25, 300))
                showSidebar();
            else if (xDiff < 0 && curX < 300)
                hideSidebar();

            firstContact = null;
        }
    });

    // Theme button
    themeToggleButton.addEventListener('click', function(){
        if (themePopup.style.display === 'block') {
            hideThemes();
        } else {
            showThemes();
        }
    });

    themePopup.addEventListener('click', function(e){
        var theme = e.target.id || e.target.parentElement.id;
        set_theme(theme);
    });

    // Hide theme selector popup when clicking outside of it
    document.addEventListener('click', function(event){
        if(themePopup.style.display === 'block' && !themeToggleButton.contains(event.target) && !themePopup.contains(event.target)) {
            hideThemes();
        }
    });

    function set_theme(theme) {
        let ace_theme;

        if (theme == 'coal' || theme == 'navy') {
            document.querySelector("[href='ayu-highlight.css']").disabled = true;
            document.querySelector("[href='tomorrow-night.css']").disabled = false;
            document.querySelector("[href='highlight.css']").disabled = true;

            ace_theme = "ace/theme/tomorrow_night";
        } else if (theme == 'ayu') {
            document.querySelector("[href='ayu-highlight.css']").disabled = false;
            document.querySelector("[href='tomorrow-night.css']").disabled = true;
            document.querySelector("[href='highlight.css']").disabled = true;

            ace_theme = "ace/theme/tomorrow_night";
        } else {
            document.querySelector("[href='ayu-highlight.css']").disabled = true;
            document.querySelector("[href='tomorrow-night.css']").disabled = true;
            document.querySelector("[href='highlight.css']").disabled = false;

            ace_theme = "ace/theme/dawn";
        }

        setTimeout(function() {
            document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.body).backgroundColor;
        }, 1);

        if (window.ace && window.editors) {
            window.editors.forEach(function(editor) {
                editor.setTheme(ace_theme);
            });
        }

        store.set('mdbook-theme', theme);

        document.body.className = theme;
    }


    // Hide Rust code lines prepended with a specific character
    var hiding_character = "#";

    Array.from(document.querySelectorAll("code.language-rust")).forEach(function(block){

        var code_block = block;
        var pre_block = block.parentNode;
        // hide lines
        var lines = code_block.innerHTML.split("\n");
        var first_non_hidden_line = false;
        var lines_hidden = false;

        for(var n = 0; n < lines.length; n++){
            if(lines[n].trim()[0] == hiding_character){
                if(first_non_hidden_line){
                    lines[n] = "<span class=\"hidden\">" + "\n" + lines[n].replace(/(\s*)# ?/, "$1") + "</span>";
                }
                else {
                    lines[n] = "<span class=\"hidden\">" + lines[n].replace(/(\s*)# ?/, "$1") + "\n"  +  "</span>";
                }
                lines_hidden = true;
            }
            else if(first_non_hidden_line) {
                lines[n] = "\n" + lines[n];
            }
            else {
                first_non_hidden_line = true;
            }
        }
        code_block.innerHTML = lines.join("");

        // If no lines were hidden, return
        if(!lines_hidden) { return; }

        var buttons = document.createElement('div');
        buttons.className = 'buttons';
        buttons.innerHTML = "<i class=\"fa fa-expand\" title=\"Show hidden lines\"></i>";

        // add expand button
        pre_block.prepend(buttons);

        pre_block.querySelector('.buttons').addEventListener('click', function(e) {
            if (e.target.classList.contains('fa-expand')) {
                var lines = pre_block.querySelectorAll('span.hidden');

                e.target.classList.remove('fa-expand');
                e.target.classList.add('fa-compress');
                e.target.title = 'Hide lines';

                Array.from(lines).forEach(function(line) {
                    line.classList.remove('hidden');
                    line.classList.add('unhidden');
                });
            } else if (e.target.classList.contains('fa-compress')) {
                var lines = pre_block.querySelectorAll('span.unhidden');

                e.target.classList.remove('fa-compress');
                e.target.classList.add('fa-expand');
                e.target.title = 'Show hidden lines';

                Array.from(lines).forEach(function(line) {
                    line.classList.remove('unhidden');
                    line.classList.add('hidden');
                });
            }
        });
    });

    Array.from(document.querySelectorAll('pre code')).forEach(function(block) {
        var pre_block = block.parentNode;
        if( !pre_block.classList.contains('playpen') ) {
            var buttons = pre_block.querySelector(".buttons");
            if(!buttons) {
                buttons = document.createElement('div');
                buttons.className = 'buttons';
                pre_block.prepend(buttons);
            }

            var clipButton = document.createElement('button');
            clipButton.className = 'fa fa-copy clip-button';
            clipButton.title = 'Copy to clipboard';
            clipButton.innerHTML = '<i class=\"tooltiptext\"></i>';

            buttons.prepend(clipButton);
            clipButton.addEventListener('mouseout', function(e){
                hideTooltip(e.currentTarget);
            });
        }
    });

    // Process playpen code blocks
    Array.from(document.querySelectorAll(".playpen")).forEach(function(pre_block){
        // Add play button
        var buttons = pre_block.querySelector(".buttons");
        if(!buttons) {
            buttons = document.createElement('div');
            buttons.className = 'buttons';
            pre_block.prepend(buttons);
        }

        var runCodeButton = document.createElement('button');
        runCodeButton.className = 'fa fa-play play-button';
        runCodeButton.hidden = true;
        runCodeButton.title = 'Run this code';

        var copyCodeClipboardButton = document.createElement('button');
        copyCodeClipboardButton.className = 'fa fa-copy clip-button';
        copyCodeClipboardButton.innerHTML = '<i class="tooltiptext"></i>';
        copyCodeClipboardButton.title = 'Copy to clipboard';

        buttons.prepend(runCodeButton);
        buttons.prepend(copyCodeClipboardButton);

        runCodeButton.addEventListener('click', function(e){
            run_rust_code(pre_block);
        });
        copyCodeClipboardButton.addEventListener('mouseout', function(e){
            hideTooltip(e.currentTarget);
        });

        let code_block = pre_block.querySelector("code");
        if (window.ace && code_block.classList.contains("editable")) {
            var undoChangesButton = document.createElement('button');
            undoChangesButton.className = 'fa fa-history reset-button';
            undoChangesButton.title = 'Undo changes';

            buttons.prepend(undoChangesButton);

            undoChangesButton.addEventListener('click', function() {
                let editor = window.ace.edit(code_block);
                editor.setValue(editor.originalCode);
                editor.clearSelection();
            });
        }
    });

    var clipboardSnippets = new Clipboard('.clip-button', {
        text: function(trigger) {
            hideTooltip(trigger);
            let playpen = trigger.closest("pre");
            return playpen_text(playpen);
        }
    });
    clipboardSnippets.on('success', function(e) {
            e.clearSelection();
            showTooltip(e.trigger, "Copied!");
    });
    clipboardSnippets.on('error', function(e) {
            showTooltip(e.trigger, "Clipboard error!");
    });

    var request = fetch("https://play.rust-lang.org/meta/crates", {
        headers: {
            'Content-Type': "application/json",
        },
        method: 'POST',
        mode: 'cors',
    });

    request
        .then(function(response) { return response.json(); })
        .then(function(response) {
            // get list of crates available in the rust playground
            let playground_crates = response.crates.map(function(item) {return item["id"];} );
            Array.from(document.querySelectorAll(".playpen")).forEach(function(block) {
                handle_crate_list_update(block, playground_crates);
            });
         });

});

function playpen_text(playpen) {
    let code_block = playpen.querySelector("code");

    if (window.ace && code_block.classList.contains("editable")) {
        let editor = window.ace.edit(code_block);
        return editor.getValue();
    } else {
        return code_block.textContent;
    }
}

function handle_crate_list_update(playpen_block, playground_crates) {
    // update the play buttons after receiving the response
    update_play_button(playpen_block, playground_crates);

    // and install on change listener to dynamically update ACE editors
    if (window.ace) {
        let code_block = playpen_block.querySelector("code");
        if (code_block.classList.contains("editable")) {
            let editor = window.ace.edit(code_block);
            editor.addEventListener("change", function(e){
                update_play_button(playpen_block, playground_crates);
            });
        }
    }
}

// updates the visibility of play button based on `no_run` class and
// used crates vs ones available on http://play.rust-lang.org
function update_play_button(pre_block, playground_crates) {
    var play_button = pre_block.querySelector(".play-button");

    // skip if code is `no_run`
    if (pre_block.querySelector('code').classList.contains("no_run")) {
        play_button.classList.add("hidden");
        return;
    }

    // get list of `extern crate`'s from snippet
    var txt = playpen_text(pre_block);
    var re = /extern\s+crate\s+([a-zA-Z_0-9]+)\s*;/g;
    var snippet_crates = [];
    while (item = re.exec(txt)) {
        snippet_crates.push(item[1]);
    }

    // check if all used crates are available on play.rust-lang.org
    var all_available = snippet_crates.every(function(elem) {
        return playground_crates.indexOf(elem) > -1;
    });

    if (all_available) {
        play_button.classList.remove("hidden");
    } else {
        play_button.classList.add("hidden");
    }
}

function hideTooltip(elem) {
    elem.firstChild.innerText="";
    elem.className = 'fa fa-copy clip-button';
}

function showTooltip(elem, msg) {
    elem.firstChild.innerText=msg;
    elem.className = 'fa fa-copy tooltipped';
}

function sidebarToggle() {
    var html = document.querySelector("html");
    if (html.classList.contains("sidebar-hidden")) {
        showSidebar();
    } else if (html.classList.contains("sidebar-visible")) {
        hideSidebar();
    } else {
        if (getComputedStyle(sidebar)['transform'] === 'none'){
            hideSidebar();
        } else {
            showSidebar();
        }
    }
}

function showThemes() {
    themePopup.style.display = 'block';
    themeToggleButton.setAttribute('aria-expanded', true);
}

function hideThemes() {
    themePopup.style.display = 'none';
    themeToggleButton.setAttribute('aria-expanded', false);
}

function showSidebar() {
    html.classList.remove('sidebar-hidden')
    html.classList.add('sidebar-visible');
    Array.from(sidebarLinks).forEach(function(link) {
        link.setAttribute('tabIndex', 0);
    });
    sidebarToggleButton.setAttribute('aria-expanded', true);
    sidebar.setAttribute('aria-hidden', false);
    store.set('mdbook-sidebar', 'visible');
}

function hideSidebar() {
    html.classList.remove('sidebar-visible')
    html.classList.add('sidebar-hidden');
    Array.from(sidebarLinks).forEach(function(link) {
        link.setAttribute('tabIndex', -1);
    });
    sidebarToggleButton.setAttribute('aria-expanded', false);
    sidebar.setAttribute('aria-hidden', true);
    store.set('mdbook-sidebar', 'hidden');
}

function run_rust_code(code_block) {
    var result_block = code_block.querySelector(".result");
    if(!result_block) {
        result_block = document.createElement('code');
        result_block.className = 'result hljs language-bash';

        code_block.append(result_block);
    }

    let text = playpen_text(code_block);
    
    var params = {
	channel: "stable",
	mode: "debug",
	crateType: "bin",
	tests: false,
	code: text,
    }

    if(text.indexOf("#![feature") !== -1) {
        params.channel = "nightly";
    }

    result_block.innerText = "Running...";

    var request = fetch("https://play.rust-lang.org/execute", {
        headers: {
            'Content-Type': "application/json",
        },
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify(params)
    });

    request
        .then(function(response) { return response.json(); })
        .then(function(response) { result_block.innerText = response.success ? response.stdout : response.stderr; })
        .catch(function(error) { result_block.innerText = "Playground communication" + error.message; });
}

(function autoHideMenu() {
    var scrollingContainer = document.querySelector('html');
    var menu = document.getElementById('menu-bar');

    var previousScrollTop = scrollingContainer.scrollTop;

    document.addEventListener('scroll', function() {
        if (menu.classList.contains('folded') && scrollingContainer.scrollTop < previousScrollTop) {
            menu.classList.remove('folded');
        } else if (!menu.classList.contains('folded') && scrollingContainer.scrollTop > previousScrollTop) {
            menu.classList.add('folded');
        }

        if (!menu.classList.contains('bordered') && scrollingContainer.scrollTop > 0) {
            menu.classList.add('bordered');
        }

        if (menu.classList.contains('bordered') && scrollingContainer.scrollTop === 0) {
            menu.classList.remove('bordered');
        }

        previousScrollTop = scrollingContainer.scrollTop;
        hideThemes();
    }, { passive: true });
})();
