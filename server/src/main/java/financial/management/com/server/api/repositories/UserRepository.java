package financial.management.com.server.api.repositories;

import financial.management.com.server.api.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String>  {
    User findByEmail(String email);
}
