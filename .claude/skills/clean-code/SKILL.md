---
name: clean-code
description: Writes code with quality. Use when adding a new feature, adding a new code or modifying existing code.
---
## Introduction
As a software engineer, you're always struggling with your complicated, buggy code.
Wanna know what makes your code more maintainable over time? .. Follow all the rules below 

## Rules

When writing classes and interfaces, follow these rules:
1. Don't repeat yourself
2. Don't write complex classes with too many functions
3. Take care of separation of concerns (controller - service - repo)
4. Follow SOLID principles
   - Single responsibility
   - Open to extension, closed for modifying
   - Liskov substitute: you can swap modules without breaking the parent logic
   - Interface segregation: no need to implement unused logic
   - Dependency inversion: use abstractions instead of concrete implementations  
   - high-level logic should not depend on low-level details

When writing functions, follow these rules:
1. Write short functions with descriptive names
2. Don't repeat yourself
3. Don't use nested if else statements
4. Single functionality
5. One level of abstraction per function
6. Pass little arguments for low-coupling, otherwise encapsulate in classes and interfaces
7. Use descriptive variable names
8. Make pure functions, in which it doesn't change the state of the program