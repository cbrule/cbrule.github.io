$(document).ready(function () {
    $('#lnkMain').click(function(){
        $('#shop').hide();
        $('#about').hide();
        $('#main').show(); 
        return false;
    });
    $('#lnkAbout').click(function(){
        $('#main').hide();
        $('#shop').hide();
        $('#about').show();
        return false;
    });
    $('#lnkShop').click(function(){
        $('#main').hide();
        $('#about').hide();
        $('#shop').show();
        return false;
    });
    Hammer(document.getElementById("caroInner")).on("swipeleft", function() {
        $('#carousel').carousel('next');
    });       
    Hammer(document.getElementById("caroInner")).on("swiperight", function() {
        $('#carousel').carousel('prev'); 
    });
});