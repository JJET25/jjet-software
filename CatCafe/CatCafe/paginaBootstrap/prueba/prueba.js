$(document).ready(function () {
    $(".row").hide();
    $(".row").slideDown("slow");
    let control = 0;
    $("#opcion1").click(function () {
        if (control == 0) {
            $("#tamaid").fadeOut();
            control++;
        }

        else if (control == 1) {
            $("#tamaid").fadeIn();
            control++;
        }

        else if (control == 2) {
            $("#tamaid").hide();
            control++;
        }
        else {
            $("#tamaid").show();
            control = 0;

        }

    });

});