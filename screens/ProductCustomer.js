import React, { useState, useEffect } from "react";
import { ScrollView, Image, View, FlatList, TouchableOpacity, Alert, StatusBar } from "react-native";
import { Text, TextInput } from "react-native-paper";
import firestore from '@react-native-firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from "../components/Logo";
import { categories } from '../constants';
import auth from '@react-native-firebase/auth';

const ProductsCustomer = ({ navigation }) => {
    const [initialProducts, setInitialProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState(1);
    const [name, setName] = useState('');

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Product')
            .onSnapshot(querySnapshot => {
                const products = [];
                querySnapshot.forEach(documentSnapshot => {
                    products.push({
                        ...documentSnapshot.data(),
                        id: documentSnapshot.id,
                    });
                });
                setProducts(products);
                setInitialProducts(products);
            });

        return () => unsubscribe();
    }, []);

    const handleCart = async (product) => {
        try {
            const user = auth().currentUser;
            if (!user) {
                // User is not authenticated, handle this case as needed
                Alert.alert("Error", "User not authenticated.");
                return;
            }
    
            const userEmail = user.email;
    
            // Fetch the latest order number
            const cartsSnapshot = await firestore()
                .collection('Carts')
                .orderBy('orderNumber', 'desc')
                .limit(1)
                .get();
    
            let newOrderNumber = 1;
            if (!cartsSnapshot.empty) {
                const latestCart = cartsSnapshot.docs[0].data();
                newOrderNumber = latestCart.orderNumber + 1;
            }
    
            const cartItem = {
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                createdBy: product.create,
                orderNumber: newOrderNumber, // Incremented order number
                quantity: 1, // Default quantity
                email: userEmail // User's email
            };
    
            await firestore()
                .collection('Carts')
                .add(cartItem);
    
            Alert.alert("Success", "Product added to cart!");
            // navigation.navigate("CartsCustomer");
        } catch (error) {
            console.error("Error adding product to cart: ", error);
            Alert.alert("Error", "Failed to add product to cart.");
        }
    };

    const renderProduct = (product) => (
        <View key={product.id} style={{ padding: 10, flexDirection: 'row', alignItems: 'center' }}>
            {product.image !== "" && (
                <View style={{ flex: 1 }}>
                    <Image
                        source={{ uri: product.image }}
                        style={{ height: 150, width: '100%', borderRadius: 10 }}
                        resizeMode="cover"
                    />
                </View>
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 5 }}>Product name: {product.title}</Text>
                <Text style={{ fontSize: 20, color: 'red' }}>Price: {product.price} ₫</Text>
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <TouchableOpacity onPress={() => handleCart(product)} style={{ marginRight: 10 }}>
                    <Image
                            source={require("../assets/add-to-cart.png")}
                            style={{ width: 24, height: 24}}
                            />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
            <StatusBar />
            <Image
                source={require('../assets/background.png')}
                style={{ width: '100%', position: 'absolute', top: -5, opacity: 0.1 }}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <Logo />
                <View style={{ flex: 1 }}>
                    <TextInput
                        style={{ borderRadius: 10, marginHorizontal: 10 }}
                        label={"Search by name"}
                        mode="outlined"
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            const result = initialProducts.filter(product => product.title.toLowerCase().includes(text.toLowerCase()));
                            setProducts(result);
                        }}
                    />
                    <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={categories}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => {
                                let isActive = item.id == activeCategory;
                                let activeTextClass = isActive ? 'text-white' : 'text-gray-700';
                                return (
                                    <TouchableOpacity
                                        onPress={() => setActiveCategory(item.id)}
                                        style={{
                                            backgroundColor: isActive ? 'rgba(0, 0, 0, 0.07)' : 'transparent',
                                            padding: 16,
                                            paddingHorizontal: 20,
                                            borderRadius: 9999,
                                            marginRight: 8,
                                            shadowColor: "#045",
                                            shadowOffset: {
                                                width: 0,
                                                height: 2,
                                            },
                                            shadowOpacity: 0.25,
                                            shadowRadius: 3.84,
                                            elevation: 5,
                                        }}
                                    >
                                        <Text style={{ fontWeight: '600', ...(isActive ? activeTextClass : {}) }}>
                                            {item.title}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            }}
                        />
                    </View>
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        <Text style={{
                            padding: 15,
                            fontSize: 25,
                            fontWeight: "bold",
                        }}>
                            Chọn món</Text>
                    </View>
                    {products.map(renderProduct)}
                </View>
            </SafeAreaView>
        </ScrollView>
    );
}

export default ProductsCustomer;
