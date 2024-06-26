import React, { useState } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator,Alert } from "react-native";
import { Text, TextInput, Button, Card, Title, IconButton, Avatar } from "react-native-paper";
import firestore from '@react-native-firebase/firestore';
import storage from "@react-native-firebase/storage";
import ImagePicker from "react-native-image-crop-picker";
import { useMyContextProvider } from "../index";

const AddNewProduct = ({ navigation }) => {
    const [controller, dispatch] = useMyContextProvider();
    const { userLogin } = controller;
    const [imagePath, setImagePath] = useState('');
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(false);

    const ProductS = firestore().collection("Product");

    const handleAddNewProduct = () => {
        if (!title || !price || !imagePath) {
            // Handle validation error
            return;
        }
    
        setLoading(true);
    
        // Kiểm tra xem Product name đã tồn tại hay chưa
        ProductS.where('title', '==', title.trim()).get()
        .then(querySnapshot => {
            if (!querySnapshot.empty) {
                // Nếu Product name đã tồn tại, hiển thị thông báo và không thêm Product mới
                Alert.alert('Error', 'Product name already exists.');
                setLoading(false);
            } else {
                // Nếu Product name chưa tồn tại, thực hiện thêm Product mới vào cơ sở dữ liệu
                ProductS.add({
                    title,
                    price,
                    create: userLogin.email
                })
                .then(response => {
                    const refImage = storage().ref("/Products/" + response.id + ".png");
                    refImage.putFile(imagePath)
                    .then(() => {
                        refImage.getDownloadURL()
                        .then(link => {
                            ProductS.doc(response.id).update({
                                id: response.id, 
                                image: link
                            })
                            .then(() => {
                                setLoading(false);
                                setImagePath('');
                                setTitle('');
                                setPrice('');
                                navigation.navigate("Product");
                            })
                            .catch(error => {
                                setLoading(false);
                                console.log("Error updating Product:", error);
                            });
                        })
                        .catch(error => {
                            setLoading(false);
                            console.log("Error getting image URL:", error);
                        });
                    })
                    .catch(error => {
                        setLoading(false);
                        console.log("Error uploading image:", error);
                    });
                })
                .catch(error => {
                    setLoading(false);
                    console.log("Error adding Product:", error);
                });
            }
        })
        .catch(error => {
            setLoading(false);
            console.log("Error checking Product name:", error);
        });
    }
        
    const handleUploadImage = () =>{
        ImagePicker.openPicker({
            mediaType: "photo",
            width: 400,
            height: 300
        })
        .then(image =>
            setImagePath(image.path)
        )
        .catch(error => console.log("Error picking image:", error));
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Card elevation={5} style={styles.card}>
                <Card.Content>
                    <Title style={styles.title}>Add New Product</Title>
                    <TextInput
                        label="Product name"
                        value={title}
                        onChangeText={setTitle}
                        style={styles.input}
                    />
                    <View style={styles.imageContainer}>
                        {imagePath !== "" ?
                            <Avatar.Image size={150} source={{ uri: imagePath }} style={styles.image} /> :
                            <Avatar.Icon size={150} icon="image-plus" style={styles.imageProductholder} />
                        }
                        <IconButton
                            icon="camera"
                            size={30}
                            onPress={handleUploadImage}
                            style={styles.uploadButton}
                        />
                    </View>
                    <TextInput
                        label="Price"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <Button
                        mode="contained"
                        onPress={handleAddNewProduct}
                        style={styles.addButton}
                        disabled={!title || !price || !imagePath || loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : "Add Product"}
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: 'white',
        padding: 10,
        justifyContent: 'center',
    },
    card: {
        margin: 10,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        marginBottom: 10,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    image: {
        marginBottom: 10,
    },
    imageProductholder: {
        marginBottom: 10,
        backgroundColor: '#f2f2f2',
    },
    uploadButton: {
        backgroundColor: '#f2f2f2',
    },
    addButton: {
        marginTop: 10,
        backgroundColor: 'tomato',
    },
});

export default AddNewProduct;
