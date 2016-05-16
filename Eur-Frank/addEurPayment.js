var eurExchangeRate = 0;
var eurFinal = 0;
var chfFinal = 0;
var checkValuta = 'EUR';

var button = $('button[data-payment-insert="card"]');
button.html('<span class="bold">EUR</span>').click(function(){

    if (eurExchangeRate != 0) {
        showEuro();
        return false;
    }

    ErplyAPI.request('getCurrencies', {}, function(response){

        if ( response.getRecordsInResponse() == 0 ) {
            ERPLY.Alert('No currencies').delayedClose( 2.5 );
            return;
        }else{
            $.each(response.getRecords(), function(index, currency){
                if(currency.code == checkValuta) {
                    eurExchangeRate = currency.rate;
                }
            });
            if(eurExchangeRate != 0){
                showEuro();
            }else{
                ERPLY.Alert('No EUR currency').delayedClose( 2.5 );
            }
        }

    }, function(response){
        ERPLY.Alert( ErplyAPI.getReadableError( response ) ).delayedClose( 2.5 );
    });

    return false;
});


getExistingCash = function() {
    var cashAmount = 0;
    $.each(TSPOS.Model.Payment.data, function(index, payment){
        if(payment.type == "cash") {
            cashAmount = payment.amount;
        }
    });
    return cashAmount;
}

getSavedCash = function() {
    var cashAmount = 0;
    $.each(TSPOS.Model.Document.prevPayments, function(index, payment){
        if(payment.type == "cash") {
            cashAmount = payment.amount;
        }
    });
    return cashAmount;
}

getRequiredCash = function() {
    var existingCash = getExistingCash();
    return (TSPOS.Model.Payment.change - existingCash);

}

removeCashPayment = function() {
    var newPaymentData = [];
    $.each(TSPOS.Model.Payment.data, function(index, payment){
        if(payment.type != 'cash') {
            newPaymentData.push(TSPOS.Model.Payment.data[index]);
        }
    });
    TSPOS.Model.Payment.data = newPaymentData;
    TSPOS.Model.Payment.calculateChange();
}


showEuro = function() {

    var params = {
        viewType: 'show-euro',
        dismiss: true,
        modal: true
    };

    var view = TSPOS.UI.openView(params);
    var chfTotal = getRequiredCash() * -1;
    var eurTotal = chfTotal / eurExchangeRate;

    $('#amount_chf').html(parseFloat(chfTotal).toFixed(2));
    $('#amount_eur').html(parseFloat(eurTotal).toFixed(2));

    view.find('.button-yes').on('click', function(e) {

        eurFinal = $('#euros').val();
        chfFinal = eurFinal/eurExchangeRate;
        chfFinal = parseFloat(chfFinal - getExistingCash()).toFixed(2);

        TSPOS.Model.Payment.addAmount('cash', chfFinal,'',true);

    });
};




TSPOS.EventManager.addEventListener('after_document_save', function() {

    if ((getSavedCash() == chfFinal) && (chfFinal > 0)) {

        /* cash in EURO */
        var params = {
            pointOfSaleID:TSPOS.Model.POS.pointOfSaleID,
            employeeID: TSPOS.Model.Employee.employeeID,
            sum: eurFinal,
            currencyCode: "EUR"
        };

        ErplyAPI.request('POSCashIN', params,function(response){
        },function(response){
            ERPLY.Alert( ErplyAPI.getReadableError( response ) ).delayedClose( 2.5 );
        });

        /* cash OUT CHF */
        var params = {
            pointOfSaleID:TSPOS.Model.POS.pointOfSaleID,
            employeeID: TSPOS.Model.Employee.employeeID,
            sum: chfFinal,
            currencyCode: "CHF"
        };

        ErplyAPI.request('POSCashOUT', params,function(response){
        },function(response){
            ERPLY.Alert( ErplyAPI.getReadableError( response ) ).delayedClose( 2.5 );
        });

        chfFinal = 0;
        eurFinal = 0;
    }
});



/**
 * Transfer order dialog UI
 * @param
 * @desc
 * @return
 */
Template["show-euro"] = '<div id="currency-modal" class="modal"><div class="modal-dialog"><div class="modal-content">' +
    '<div class="modal-header">' +
    '<span trans class="text-24px bold">Insert euro payment</span>' +
    '<div class="modal-actions pull-right" style="padding-right: 12px;">' +
    '<button type="button" class="close">&times;</button>' +
    '</div>' +
    '</div>' +
    '<div class="modal-body" style="padding-top: 16px;">' +
    '<p style="font-size:21px;">CHF: <span style="padding-left:12px;  font-weight: bold;" id="amount_chf"></span></p>' +
    '<p style="font-size:21px;">EUR: <span style="padding-left:12px; font-weight: bold;" id="amount_eur"></span></p>' +
    '<br>' +
    '<form>'+
    '<p style="font-size:21px;padding-bottom: -35px;">Euros: <input type="number" id="euros" style="padding-left:12px;" autofocus></p><br>'+
    '</form>'+
    '</div>' +
    '<div class="modal-footer" style="margin-top:0px;">' +
    '<button type="button" style="float:left;border-radius: 4px;color: #232323;background-color: #ea5257 ;font-family: Proxima Nova Bold;font-weight: 300;text-transform: uppercase;position: relative;width: 160px;height: 70px;font-size: 24px!important;" class="close" data-dismiss="modal" >Cancel</button>' +
    '<button type="button" style="float:right;border-radius: 4px;color: #232323;background-color: #a5c536;font-family: Proxima Nova Bold;font-weight: 300;text-transform: uppercase;position: relative;width: 160px;height: 70px;font-size: 24px!important;" class="btn button-yes close" data-dismiss="modal">Add</button>' +
    '</div>' +
    '</div></div></div>';



