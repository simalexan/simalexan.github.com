---
layout: page
title: Testing Jekyll!
tagline: & seeing what it can do
---
{% include JB/setup %}

<div style="text-align: center;">
<h3>Aleksandar Simovic</h3>
</div>

<input id="customerEmail" value="" placeholder="Type in an email" style="height: 25px; width: 200px;">
<button onclick="invokeMe()" style="border: none; width: 100px; height:35px; background-color: dark-gray; color: white;">Test the custom event</button>

<div data-gift-button></div>


<script>
  var GiftButton = GiftButton || {};
  (function() {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://simalexan.github.io/gbtn/gbtn.js?uuid=05b0e0dc-543c-4647-bf61-b89e5fa9d396&t=CUSTOM-EMAIL';
    var entry = document.getElementsByTagName('script')[0];
    entry.parentNode.insertBefore(script, entry);
  })();
</script>

<script type="application/javascript">
	function invokeMe(){
		var email = $('#customerEmail').val();
		_gcGBCustomInvoke('Here we would show a custom message', email);
	}
</script>
