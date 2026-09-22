package com.webbox.order;

import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Map;

final class MySqlIntegrationTestDatabase {
 private final String host,port,name,user,password;

 private MySqlIntegrationTestDatabase(String host,String port,String name,String user,String password){
  this.host=host;this.port=port;this.name=name;this.user=user;this.password=password;
 }

 static MySqlIntegrationTestDatabase fromEnvironment(){
  Map<String,String> env=System.getenv();
  String host=require(env,"WEBBOX_DB_HOST");
  String port=require(env,"WEBBOX_DB_PORT");
  String sourceName=require(env,"WEBBOX_DB_NAME");
  String testName=env.getOrDefault("WEBBOX_TEST_DB_NAME","webbox_backend_it");
  if(!testName.matches("[A-Za-z0-9_]+"))throw new IllegalStateException("WEBBOX_TEST_DB_NAME may contain only letters, digits, and underscores.");
  if(testName.equals(sourceName))throw new IllegalStateException("WEBBOX_TEST_DB_NAME must differ from WEBBOX_DB_NAME.");
  return new MySqlIntegrationTestDatabase(host,port,testName,require(env,"WEBBOX_DB_USERNAME"),require(env,"WEBBOX_DB_PASSWORD"));
 }

 void assertReachable(){
  try(Connection ignored=DriverManager.getConnection(url(),user,password)){
   // A limited application user needs access only to this pre-provisioned database.
  }catch(Exception exception){throw new IllegalStateException("Could not connect to the isolated MySQL integration-test database. Provision WEBBOX_TEST_DB_NAME and grant the application user access before running this suite.",exception);}
 }

 String url(){return "jdbc:mysql://"+host+":"+port+"/"+name+"?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia%2FShanghai";}
 String user(){return user;}
 String password(){return password;}

 private static String require(Map<String,String> env,String key){
  String value=env.get(key);
  if(value==null||value.isBlank())throw new IllegalStateException(key+" must be set before running the MySQL integration tests.");
  return value;
 }
}
