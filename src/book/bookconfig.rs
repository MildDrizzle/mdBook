extern crate rustc_serialize;
use self::rustc_serialize::json::Json;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};

use utils;

#[derive(Debug, Clone)]
pub struct BookConfig {
    pub title: String,
    pub author: String,
    dest: PathBuf,
    src: PathBuf,
    indent_spaces: i32,
    multilingual: bool,
}


impl BookConfig {
    pub fn new() -> Self {
        BookConfig {
            title: String::new(),
            author: String::new(),
            dest: PathBuf::from("book"),
            src: PathBuf::from("src"),
            indent_spaces: 4,
            multilingual: false,
        }
    }

    pub fn read_config(&mut self) -> &mut Self {

        // If the file does not exist, return early
        let mut config_file = match File::open(self.src.join("book.json")) {
            Ok(f) => f,
            Err(_) => return self,
        };

        let mut data = String::new();
        config_file.read_to_string(&mut data).unwrap();

        // Convert to JSON
        let config = Json::from_str(&data).unwrap();

        // Extract data

        // Title & author
        if let Some(a) = config.find_path(&["title"]) { self.title = a.to_string().replace("\"", "") }
        if let Some(a) = config.find_path(&["author"]) { self.author = a.to_string().replace("\"", "") }

        // Destination
        if let Some(a) = config.find_path(&["dest"]) {
            let dest = PathBuf::from(&a.to_string().replace("\"", ""));

            // If path is relative make it absolute from the parent directory of src
            if dest.is_relative() {
                let dest = &self.src().parent().unwrap().join(&dest);
                self.set_dest(dest);
            }
        }

        self
    }

    pub fn dest(&self) -> &Path {
        &self.dest
    }

    pub fn set_dest(&mut self, dest: &Path) -> &mut Self {
        self.dest = dest.to_owned();
        self
    }

    pub fn src(&self) -> &Path {
        &self.src
    }

    pub fn set_src(&mut self, src: &Path) -> &mut Self {
        self.src = src.to_owned();
        self
    }

}
