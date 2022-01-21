package com.ssafy.db.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;

/**
 * 유저 모델 정의.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class User {
    @Id
    @Column(length = 20)
    private String userId;

    @JsonIgnore
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    String password;

    @Column(length = 20 ,nullable = false)
    private String userName;

    @Column(length = 100)
    private String userProfile;

    private Boolean userHomeroom;

    private Boolean master;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "roomId")
    private Room room;
}