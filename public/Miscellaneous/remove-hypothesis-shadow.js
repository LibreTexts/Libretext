$(window).on('load', function() {
    const hypothesisElements = document.getElementsByTagName('hypothesis-sidebar');
    if (hypothesisElements && hypothesisElements.length > 0) {
        const hypothesis = hypothesisElements[0];
        try {
            const collapsedElements = hypothesis.shadowRoot.querySelectorAll('.sidebar-collapsed\\:bg-black\\/\\[\\.08\\]');
            collapsedElements.forEach(function(element) {
                element.style.backgroundColor = 'transparent';
                element.style.background = 'transparent';
            });
        } catch (e) {
            console.error('Error modifying Hypothes.is sidebar elements');
            console.error(e);
        }
    }
});