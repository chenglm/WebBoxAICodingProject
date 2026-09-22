package com.webbox.user;

import static org.junit.jupiter.api.Assertions.*;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.List;
import org.junit.jupiter.api.Test;

class PreferencesValidationTest {
 private final Validator validator=Validation.buildDefaultValidatorFactory().getValidator();

 @Test void accepts_prd_flavour_intensity_values(){
  for(String taste:List.of("Light","Moderate","Rich")){
   var preferences=new UserModels.Preferences(List.of(),null,taste,null,List.of(),false);
   assertTrue(validator.validate(preferences).isEmpty(),taste);
  }
 }

 @Test void rejects_legacy_flavour_type_values(){
  var preferences=new UserModels.Preferences(List.of(),null,"Savory",null,List.of(),false);
  assertFalse(validator.validate(preferences).isEmpty());
 }
}
