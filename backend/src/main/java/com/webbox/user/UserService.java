package com.webbox.user;

import com.webbox.common.ApiException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.webbox.user.UserModels.*;

@Service
public class UserService { private final JdbcTemplate jdbc; public UserService(JdbcTemplate jdbc){this.jdbc=jdbc;}
 public Preferences preferences(long userId){ var r=jdbc.query("select preferred_categories,spice_preference,taste_preference,budget_cents from user_preferences where user_id=?",(rs,n)->new Object[]{rs.getString(1),rs.getString(2),rs.getString(3),rs.getObject(4,Long.class)},userId); if(r.isEmpty())return new Preferences(List.of(),null,null,null,List.of()); Object[] x=r.get(0); return new Preferences(csv((String)x[0]),(String)x[1],(String)x[2],(Long)x[3],jdbc.query("select allergen from user_allergens where user_id=?",(rs,n)->rs.getString(1),userId)); }
 @Transactional public Preferences savePreferences(long userId,Preferences p){ if(p.budgetCents()!=null&&p.budgetCents()<0)throw new ApiException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","Budget cannot be negative."); jdbc.update("update user_preferences set preferred_categories=?,spice_preference=?,taste_preference=?,budget_cents=? where user_id=?",String.join(",",safe(p.preferredCategories())),p.spicePreference(),p.tastePreference(),p.budgetCents(),userId); jdbc.update("delete from user_allergens where user_id=?",userId); for(String a:safe(p.allergens()))jdbc.update("insert into user_allergens(user_id,allergen) values(?,?)",userId,a); return preferences(userId); }
 public List<Address> addresses(long userId){return jdbc.query("select id,label,address,is_default from addresses where user_id=? order by is_default desc,id",(rs,n)->new Address(rs.getLong(1),rs.getString(2),rs.getString(3),rs.getBoolean(4)),userId);}
 @Transactional public Address addAddress(long userId,Address a){ if(a.isDefault())jdbc.update("update addresses set is_default=false where user_id=?",userId); jdbc.update("insert into addresses(user_id,label,address,is_default) values(?,?,?,?)",userId,a.label(),a.address(),a.isDefault()); long id=jdbc.queryForObject("select last_insert_id()",Long.class); return new Address(id,a.label(),a.address(),a.isDefault()); }
 @Transactional public Address updateAddress(long userId,long id,Address a){ requireAddress(userId,id);if(a.isDefault())jdbc.update("update addresses set is_default=false where user_id=?",userId);jdbc.update("update addresses set label=?,address=?,is_default=? where id=? and user_id=?",a.label(),a.address(),a.isDefault(),id,userId);return new Address(id,a.label(),a.address(),a.isDefault());}
 public void deleteAddress(long userId,long id){if(jdbc.update("delete from addresses where id=? and user_id=?",id,userId)==0)throw new ApiException(HttpStatus.NOT_FOUND,"ADDRESS_NOT_FOUND","Address not found.");}
 private void requireAddress(long uid,long id){if(jdbc.queryForObject("select count(*) from addresses where id=? and user_id=?",Integer.class,id,uid)==0)throw new ApiException(HttpStatus.NOT_FOUND,"ADDRESS_NOT_FOUND","Address not found.");}
 private List<String> csv(String s){return s==null||s.isBlank()?List.of():List.of(s.split(","));} private List<String> safe(List<String>s){return s==null?List.of():s;}
}
