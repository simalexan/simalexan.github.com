---
layout: page
title: Testing Jekyll!
tagline: & seeing what it can do
---
{% include JB/setup %}

<div style="text-align: center;">
<h3>Aleksandar Simovic</h3>
</div>

<div style="width: 30%; margin: 0 auto;">

  <div style="margin-bottom: 15px;">
    <input id="customerEmail" value="" placeholder="Type in the customer email" 
    style="height: 35px; width: 250px; border-radius: 4px; background-color:#0E4A6D; border: 1px solid #073554; color: #77A8CF; font-size: 16px;">
  </div>
  
  <div style="margin-bottom: 15px;">
    <textarea id="customMessage" value="" placeholder="Type in the gbox message" 
    style="height: 100px; width: 250px; border-radius: 4px; background-color:#0E4A6D; border: 2px solid #073554; color: #77A8CF; font-size: 16px; resize: none;"></textarea>
  </div>

  <button onclick="invokeMe()" style="border: none; border-radius: 4px; width: 200px; height:35px; background-color: dark-gray; color: white; font-size: 16px; cursor: pointer; ">Test the custom event</button>
</div>
<div data-gift-button></div>


<script>
  var GiftButton = GiftButton || {};
  (function() {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://simalexan.github.io/gbtn/gbtn.js?uuid=1f72ac29-4832-4156-8e13-dde0f6ffff78';
    var entry = document.getElementsByTagName('script')[0];
    entry.parentNode.insertBefore(script, entry);
  })();
</script>

<script type="application/javascript">
	function invokeMe(){
		var email = GiftButton.$('#customerEmail').val();
		var msg = GiftButton.$('#customMessage').val() || 'Here we would show a custom message';
		_gcGBCustomInvoke(msg, email);
	}
</script>
