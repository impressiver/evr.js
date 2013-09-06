/**
 * Helper Functions
 */

// Fill a <pre> with the example source
function showExampleSource(i, script) {
  var example = $(this).attr('class').match(/example-[^\s]+/i);
  $('pre.' + example).html($.trim($(this).html()));
}

// View source of current page in a new window
function viewsource(e){
  window.open("view-source:" + window.location, 'evr.js.source');
}

// Smooth scroll to anchor
function scrollTo(e) {
  e.preventDefault();

  var anchor = e.currentTarget.hash.slice(1);
      $t = $('a[name=' + anchor + ']');

  if (!$t.size()) return;

  var dvh = $(window).height(),
      dvtop = $(window).scrollTop(),
      eltop = $t.offset().top,
      mgn = {top: 100, bottom: 100};

  var scrollTo = eltop - mgn.top;

  $('html,body').animate({
    scrollTop: scrollTo
  }, {
    duration: 500
  });
}