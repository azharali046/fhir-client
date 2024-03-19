(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      var patientId = 'eW14uhl2OLK8k0.bB15kP.g3'; // Replace with actual patient ID
      var obv = smart.api.fetchAll({
                    type: 'Observation',
                    query: {
                      subject: patientId, // Use the patient ID here
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                      }
                    }
                  });

      $.when(obv).fail(onError);

      $.when(obv).done(function(obv) {
        var byCodes = smart.byCodes(obv, 'code');
        var gender = ''; // Epic doesn't return gender information
        var fname = ''; // Epic doesn't return name information
        var lname = ''; // Epic doesn't return name information

        var height = byCodes('8302-2');
        var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
        var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
        var hdl = byCodes('2085-9');
        var ldl = byCodes('2089-1');

        var p = defaultPatient();
        p.birthdate = ''; // Epic doesn't return birthdate information
        p.gender = gender;
        p.fname = fname;
        p.lname = lname;
        p.height = getQuantityValueAndUnit(height[0]);

        if (typeof systolicbp != 'undefined')  {
          p.systolicbp = systolicbp;
        }

        if (typeof diastolicbp != 'undefined') {
          p.diastolicbp = diastolicbp;
        }

        p.hdl = getQuantityValueAndUnit(hdl[0]);
        p.ldl = getQuantityValueAndUnit(ldl[0]);

        ret.resolve(p);
      });
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };

})(window);