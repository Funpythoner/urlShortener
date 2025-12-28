package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	mux "github.com/gorilla/mux"
	pgx "github.com/jackc/pgx/v5"
	gonanoid "github.com/matoous/go-nanoid/v2"
)
type url struct{
	LongUrl string	`json:"longUrl"`
	ShortUrl string	`json:"shortUrl"`
}
func addUrl(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	reqBody, _ := io.ReadAll(r.Body)
	var newEntry url
	json.Unmarshal(reqBody, &newEntry)
	conn, err := pgx.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		fmt.Printf("Failed to connect to DB: %v\n", err)
		http.Error(w, "DB connection failed", http.StatusInternalServerError)
		return
	}
	defer conn.Close(context.Background())

	maxRetries := 10
	success := false

	for i := 0; i < maxRetries; i++ {
		newEntry.ShortUrl, _ = gonanoid.New(8)
		query := "INSERT INTO urls (fullurl, shorturl) VALUES ($1, $2)"
		_, err = conn.Exec(context.Background(), query, newEntry.LongUrl, newEntry.ShortUrl)
		if err == nil {
			success = true
			break
		}
		fmt.Printf("Attempt %d failed (likely collision): %v\n", i+1, err)
	}
	if !success {
		http.Error(w, "Could not generate unique short URL", http.StatusConflict)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newEntry)
}
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func (w http.ResponseWriter, r *http.Request){
		w.Header().Set("Access-Control-Allow-Origin", "https://shortify-3w0i.onrender.com") 
		w.Header().Set("Access-Control-Allow-Headers","Content-Type")
		w.Header().Set("Access-Control-Allow-Methods","POST,OPTIONS")
		if r.Method=="OPTIONS"{
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w,r)
	})
}
func main(){
	router := mux.NewRouter()
	router.Handle("/shorten",enableCORS(http.HandlerFunc(addUrl))).Methods("POST","OPTIONS")
	port := os.Getenv("PORT")
	if port==""{
		port="3000"
	}
	fmt.Println("Server started at port",port)
	http.ListenAndServe("0.0.0.0:"+port,router)
}
