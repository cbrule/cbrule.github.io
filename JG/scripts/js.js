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
});