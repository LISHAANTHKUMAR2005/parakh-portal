package com.parakh.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class ParakhBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ParakhBackendApplication.class, args);
	}

}
