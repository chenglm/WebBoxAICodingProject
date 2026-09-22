package com.webbox.order;

import com.webbox.common.ApiException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PricingService {
 public long price(long baseCents,int quantity,Collection<Long> extras){if(quantity<1||quantity>5)throw new ApiException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","Quantity must be between 1 and 5.");long per=baseCents+extras.stream().mapToLong(Long::longValue).sum();return Math.multiplyExact(per,quantity);}
}
